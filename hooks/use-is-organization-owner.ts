"use client";

import { useAuth } from "@/providers/auth-provider";

/**
 * Ownership is a structural relationship (organization.ownerId), not a
 * permission — it's absolute and can't be granted via the Rules table by
 * design. Never derive this from role name or account_type.
 */
export function useIsOrganizationOwner(
  ownerId: number | undefined | null,
): boolean {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated || !currentUser || ownerId == null) return false;
  return currentUser.id === ownerId;
}
