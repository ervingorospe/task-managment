"use client";

import { useAuth } from "@/providers/auth-provider";

export function useIsOrganizationMember(
  organizationId: number | undefined | null,
): boolean {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !currentUser || organizationId == null) return false;
  return currentUser.memberships.some(
    (m) => m.organization.id === organizationId,
  );
}
