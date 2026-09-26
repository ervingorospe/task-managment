"use client";

import { useAuth } from "@/providers/auth-provider";
import type { UserMembership } from "@/lib/types/user/user-membership.type";

/**
 * Looks up the caller's own membership for an org by its slug, straight
 * from `currentUser.memberships` — no backend call, so it still works even
 * when the org's own detail fetch 403s (which it always does for a
 * deactivated membership, see permissions.service.ts's getMembership()).
 * Pages use this to tell "deactivated here" apart from "never a member"
 * when `useOrganizationBySlug` comes back with `organization: null`.
 */
export function useMembershipBySlug(
  slug: string | undefined,
): UserMembership | null {
  const { currentUser } = useAuth();
  if (!currentUser || !slug) return null;
  return (
    currentUser.memberships.find(
      (m) => m.organization.settings.slug === slug,
    ) ?? null
  );
}
