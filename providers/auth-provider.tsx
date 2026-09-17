"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import type { CurrentUser } from "@/lib/types/user/current-user.type";
import type { UserMembership } from "@/lib/types/user/user-membership.type";
import { mockAccounts } from "@/lib/data/mock-accounts";
import type { Rule } from "@/lib/types/rule/rule.type";
import type { Permission } from "@/lib/data/permissions";

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

  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  switchOrganization: (organizationId: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

  function login(email: string, password: string): LoginResult {
    const account = mockAccounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    );

    if (!account || account.password !== password) {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    setCurrentUser(account.user);

    setActiveOrgId(account.user.memberships[0]?.organization.id ?? null);

    return {
      success: true,
    };
  }

  function logout() {
    setCurrentUser(null);
    setActiveOrgId(null);
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
