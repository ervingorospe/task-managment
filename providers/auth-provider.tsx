"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { UserMembership } from "@/lib/types/user/user-membership.type";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { Permission } from "@/lib/data/permissions";
import {
  login as apiLogin,
  logout as apiLogout,
  fetchCurrentUser,
  UnverifiedAccountError,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

/** "personal" is a real, selectable state in the topbar org switcher —
 * every user's own standalone space, no organization involved, not just a
 * fallback for "nothing to select." Available to anyone regardless of how
 * many organizations they belong to. */
const PERSONAL = "personal" as const;
type ActiveOrgId = number | typeof PERSONAL | null;

// Remembers which org was active so a restored session lands back where
// the user left off, not always on their first membership.
const ACTIVE_ORG_STORAGE_KEY = "ticketing_active_org_id";

function readStoredActiveOrgId(): ActiveOrgId {
  const raw = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  if (raw === PERSONAL) return PERSONAL;
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

function writeStoredActiveOrgId(id: ActiveOrgId) {
  if (id == null) localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
  else localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, String(id));
}

/** Honors a stored selection (Personal or a still-valid membership) for
 * anyone; otherwise defaults to the first real membership, falling back to
 * Personal only if they have none. */
function defaultActiveOrgId(
  user: CurrentUser,
  storedOrgId: ActiveOrgId,
): ActiveOrgId {
  if (storedOrgId === PERSONAL) return PERSONAL;
  if (user.memberships.some((m) => m.organization.id === storedOrgId)) {
    return storedOrgId;
  }
  return user.memberships[0]?.organization.id ?? PERSONAL;
}

interface LoginResult {
  success: boolean;
  error?: string;
  /** True when the credentials were correct but the account hasn't clicked
   * its verification link yet — the login page redirects to
   * /verify-pending instead of showing `error` as a generic failure. */
  needsVerification?: boolean;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  /** True while attempting to restore a session from the marker cookie on
   * first load — callers that redirect on `!isAuthenticated` should wait
   * for this to go false first, or they'll bounce a real session to
   * /login before it's had a chance to restore. */
  isInitializing: boolean;

  /**
   * The membership of the organization currently selected by the user.
   * `null` in Personal mode — there's no organization involved.
   */
  activeMembership: UserMembership | null;

  /**
   * The organization currently selected by the user. `null` in Personal
   * mode.
   */
  activeOrganization: UserMembership["organization"] | null;

  /**
   * True when the topbar's "Personal" entry is selected — an owner
   * account's own standalone space, no organization. Distinguishes this
   * explicit state from the (otherwise identical-looking) case of a
   * member account with no memberships at all.
   */
  isPersonalMode: boolean;

  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: number | typeof PERSONAL) => void;
  updateProfile: (
    patch: Partial<Pick<CurrentUser, "firstName" | "lastName" | "email" | "avatar">>,
  ) => void;
  /**
   * Drops an organization from the in-memory membership list — for after
   * it's deleted (or the user otherwise loses access) elsewhere in the
   * app. `currentUser` is only fetched at login, so without this the
   * sidenav/topbar org switcher (both read straight from
   * `currentUser.memberships`) would keep showing it until the next
   * login.
   */
  removeMembership: (organizationId: number) => void;
  /**
   * Re-fetches the current user from the backend and replaces
   * `currentUser` wholesale — for after an action elsewhere (e.g.
   * creating a new organization) changes the membership list in a way
   * that can't be patched in locally, since the response to that action
   * doesn't carry a full membership row (id, role, etc.) to construct one
   * from. Same lookup `login()` uses. No-ops if no one's logged in.
   */
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Pre-real-auth builds set this directly from JS (plaintext email, not
// httpOnly) as the "session" marker — real auth replaced it with the
// backend-issued, httpOnly `ticketing_auth` cookie (see auth.constants.ts),
// but a browser that used this app before that rewrite still has the old
// one sitting around indefinitely, since nothing ever cleared it. One-time
// best-effort cleanup; harmless no-op if it isn't present.
function clearLegacySessionCookie() {
  document.cookie = "ticketing_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<ActiveOrgId>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    clearLegacySessionCookie();
  }, []);

  // Restores the session on first load — the httpOnly cookie the backend
  // set on login isn't readable from JS at all, so this just always asks
  // the backend "who am I" and takes null (a 401) as "not logged in"
  // rather than checking for a cookie's presence first.
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (cancelled || !user) return;
        setCurrentUser(user);
        const orgId = defaultActiveOrgId(user, readStoredActiveOrgId());
        setActiveOrgId(orgId);
      })
      .catch((error) => {
        console.error("Session restore failed", error);
      })
      .finally(() => {
        if (!cancelled) setIsInitializing(false);
      });

    return () => {
      cancelled = true;
    };
    // Deliberately once-on-mount — login()/logout() own state changes
    // after this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string): Promise<LoginResult> {
    let user: CurrentUser;
    try {
      user = await apiLogin(email.trim(), password);
    } catch (error) {
      if (error instanceof UnverifiedAccountError) {
        return { success: false, needsVerification: true, error: error.message };
      }
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      console.error("Login failed", error);
      return {
        success: false,
        error: "Couldn't reach the backend. Is it running?",
      };
    }

    const orgId = defaultActiveOrgId(user, readStoredActiveOrgId());
    setCurrentUser(user);
    setActiveOrgId(orgId);
    writeStoredActiveOrgId(orgId);
    return { success: true };
  }

  async function logout() {
    try {
      await apiLogout();
    } catch (error) {
      console.error("Logout request failed", error);
    }
    setCurrentUser(null);
    setActiveOrgId(null);
    writeStoredActiveOrgId(null);
  }

  function updateProfile(
    patch: Partial<Pick<CurrentUser, "firstName" | "lastName" | "email" | "avatar">>,
  ) {
    setCurrentUser((prev) => (prev ? { ...prev, ...patch } : prev));
    // TODO: PATCH /users/me
  }

  function switchOrganization(organizationId: number | typeof PERSONAL) {
    if (!currentUser) return;

    if (organizationId === PERSONAL) {
      setActiveOrgId(PERSONAL);
      writeStoredActiveOrgId(PERSONAL);
      return;
    }

    const belongsToOrg = currentUser.memberships.some(
      (membership) => membership.organization.id === organizationId,
    );

    if (belongsToOrg) {
      setActiveOrgId(organizationId);
      writeStoredActiveOrgId(organizationId);
    }
  }

  function removeMembership(organizationId: number) {
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            memberships: prev.memberships.filter(
              (membership) => membership.organization.id !== organizationId,
            ),
          }
        : prev,
    );
    // activeMembership/activeOrganization below already fall back to the
    // first remaining membership once this one is gone from the list, so
    // activeOrgId doesn't need to be reset explicitly here.
  }

  async function refreshCurrentUser() {
    const user = await fetchCurrentUser();
    if (user) setCurrentUser(user);
  }

  const isPersonalMode = activeOrgId === PERSONAL;

  // No fallback to memberships[0] when Personal is explicitly selected —
  // that fallback is only for "activeOrgId doesn't match any membership
  // yet" (e.g. right after login, before a stored id resolves).
  const activeMembership = isPersonalMode
    ? null
    : (currentUser?.memberships.find(
        (membership) => membership.organization.id === activeOrgId,
      ) ??
      currentUser?.memberships[0] ??
      null);

  const activeOrganization = activeMembership?.organization ?? null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isInitializing,
        activeMembership,
        activeOrganization,
        isPersonalMode,
        login,
        logout,
        switchOrganization,
        updateProfile,
        removeMembership,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function hasPermission(rules: Rule[], action: Permission): boolean {
  return rules.some((rule) => rule.action === action);
}

export function usePermission(action: Permission) {
  const { activeMembership, isPersonalMode } = useAuth();

  // No team to restrict against in Personal mode — the owner has full
  // control over their own standalone space, same as how a Superadmin
  // role bypasses these checks for a real org.
  if (isPersonalMode) return true;

  if (!activeMembership) return false;

  return hasPermission(activeMembership.role.rules, action);
}
