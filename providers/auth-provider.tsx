"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { UserMembership } from "@/lib/types/user/user-membership.type";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { Permission } from "@/lib/data/permissions";
import { fetchUserByEmail } from "@/lib/api/users";

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

    setCurrentUser(user);
    setActiveOrgId(user.memberships[0]?.organization.id ?? null);
    return { success: true };
  }

  function logout() {
    setCurrentUser(null);
    setActiveOrgId(null);
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
