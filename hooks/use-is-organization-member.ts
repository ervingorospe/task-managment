"use client";

import { useAuth } from "@/providers/auth-provider";

export type MembershipStatus = "not-member" | "deactivated" | "active";

/** Distinguishes "never a member" from "was a member, deactivated by an
 * org admin" — MemberGuard shows a different empty state for each instead
 * of collapsing both into a 404. */
export function useOrganizationMembershipStatus(
  organizationId: number | undefined | null,
): MembershipStatus {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !currentUser || organizationId == null) {
    return "not-member";
  }
  const membership = currentUser.memberships.find(
    (m) => m.organization.id === organizationId,
  );
  if (!membership) return "not-member";
  return membership.isActive ? "active" : "deactivated";
}

export function useIsOrganizationMember(
  organizationId: number | undefined | null,
): boolean {
  return (
    useOrganizationMembershipStatus(organizationId) !== "not-member"
  );
}
