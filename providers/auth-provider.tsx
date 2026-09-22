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
import { fetchUserByEmail } from "@/lib/api/users";
import { SESSION_COOKIE_NAME } from "@/lib/constants/session-cookie.constant";

// Carries the logged-in email so a reload can restore the session instead
// of just losing it — not a token, there's still no real backend auth to
// verify against (see DEFAULT_PASSWORD below), so this is only as trustworthy
// as knowing someone's email address already is. Doubles as the marker
// middleware checks for.
function setSessionCookie(email: string) {
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(email)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

function readSessionEmail(): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// Remembers which org was active so a restored session lands back where
// the user left off, not always on their first membership.
const ACTIVE_ORG_STORAGE_KEY = "ticketing_active_org_id";

function readStoredActiveOrgId(): number | null {
  const raw = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}

function writeStoredActiveOrgId(id: number | null) {
  if (id == null) localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
  else localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, String(id));
}

// No auth backend yet, by design (see ticketing-backend's README) — so
// there's no real password to check. Every user in the backend's users
// table can log in with this one shared password until real auth exists.
const DEFAULT_PASSWORD = "123";

interface LoginResult {
  success: boolean;
  error?: string;
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
   */
  activeMembership: UserMembership | null;

  /**
   * The organization currently selected by the user.
   */
  activeOrganization: UserMembership["organization"] | null;

  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  switchOrganization: (organizationId: number) => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restores the session on first load from the cookie login() sets, so a
  // reload doesn't just discard everything the way in-memory-only state
  // used to.
  useEffect(() => {
    const email = readSessionEmail();
    if (!email) {
      setIsInitializing(false);
      return;
    }

    let cancelled = false;
    fetchUserByEmail(email)
      .then((user) => {
        if (cancelled) return;
        if (!user) {
          // Cookie points at a user that no longer exists — nothing to
          // restore, so stop treating it as a session.
          clearSessionCookie();
          return;
        }
        setCurrentUser(user);
        const storedOrgId = readStoredActiveOrgId();
        const orgId = user.memberships.some(
          (m) => m.organization.id === storedOrgId,
        )
          ? storedOrgId
          : (user.memberships[0]?.organization.id ?? null);
        setActiveOrgId(orgId);
      })
      .catch((error) => {
        // Network/backend hiccup — leave the cookie alone so a later
        // reload (once the backend's reachable) can still restore the
        // session; this load just falls through to logged-out.
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
    if (password !== DEFAULT_PASSWORD) {
      return { success: false, error: "Invalid email or password." };
    }

    let user;
    try {
      user = await fetchUserByEmail(email.trim());
    } catch (error) {
      console.error("Login lookup failed", error);
      return {
        success: false,
        error: "Couldn't reach the backend. Is it running?",
      };
    }

    if (!user) {
      return { success: false, error: "Invalid email or password." };
    }

    const orgId = user.memberships[0]?.organization.id ?? null;
    setCurrentUser(user);
    setActiveOrgId(orgId);
    writeStoredActiveOrgId(orgId);
    setSessionCookie(user.email);
    return { success: true };
  }

  function logout() {
    setCurrentUser(null);
    setActiveOrgId(null);
    clearSessionCookie();
    writeStoredActiveOrgId(null);
  }

  function updateProfile(
    patch: Partial<Pick<CurrentUser, "firstName" | "lastName" | "email" | "avatar">>,
  ) {
    setCurrentUser((prev) => (prev ? { ...prev, ...patch } : prev));
    // TODO: PATCH /users/me
  }

  function switchOrganization(organizationId: number) {
    if (!currentUser) return;

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
    if (!currentUser) return;
    const user = await fetchUserByEmail(currentUser.email);
    if (user) setCurrentUser(user);
  }

  const activeMembership =
    currentUser?.memberships.find(
      (membership) => membership.organization.id === activeOrgId,
    ) ??
    currentUser?.memberships[0] ??
    null;

  const activeOrganization = activeMembership?.organization ?? null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isInitializing,
        activeMembership,
        activeOrganization,
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
  const { activeMembership } = useAuth();

  if (!activeMembership) return false;

  return hasPermission(activeMembership.role.rules, action);
}
