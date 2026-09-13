"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { UserMembership } from "@/lib/types/user/user-membership.type";
import { mockAccounts } from "@/lib/data/mock-accounts";

interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  /** The org the user is currently acting in — drives permission checks and the Topbar. */
  activeMembership: UserMembership | null;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  switchOrganization: (organizationId: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

  function login(email: string, password: string): LoginResult {
    // MOCK: real version calls the Auth service and checks a hashed
    // password server-side, plus the isVerified/first-login-onboarding
    // branches from the original spec. This is a stand-in comparison only.
    const account = mockAccounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!account || account.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }

    setCurrentUser(account.user);
    setActiveOrgId(account.user.memberships[0]?.organization.id ?? null);
    return { success: true };
  }

  function logout() {
    setCurrentUser(null);
    setActiveOrgId(null);
  }

  function switchOrganization(organizationId: number) {
    if (!currentUser) return;
    const belongsToOrg = currentUser.memberships.some(
      (m) => m.organization.id === organizationId,
    );
    if (belongsToOrg) setActiveOrgId(organizationId);
  }

  const activeMembership =
    currentUser?.memberships.find((m) => m.organization.id === activeOrgId) ??
    currentUser?.memberships[0] ??
    null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        activeMembership,
        login,
        logout,
        switchOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// Real permission check now — reads the active membership's resolved
// Rule[] directly. Superadmin's role already contains every Rule (built
// that way in default-roles.ts), so there's no "*" wildcard to special-case.
export function usePermission(action: string) {
  const { activeMembership } = useAuth();
  if (!activeMembership) return false;
  return activeMembership.role.rules.some((rule) => rule.action === action);
}
