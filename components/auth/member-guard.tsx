"use client";

import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useIsOrganizationMember } from "@/hooks/use-is-organization-member";
import { OrganizationDisabledState } from "@/components/organization/organization-disabled-state";

export default function MemberGuard({
  organizationId,
  organizationName,
  isActive = true,
  children,
}: {
  organizationId: number | null;
  /** Required together with `isActive` to show the disabled empty state
   * instead of children — omit both if this org can never be disabled
   * from this caller's context. */
  organizationName?: string;
  isActive?: boolean;
  children: ReactNode;
}) {
  if (!organizationId) notFound();

  const { isInitializing } = useAuth();
  const isMember = useIsOrganizationMember(organizationId);

  // currentUser/memberships are briefly empty while the session is still
  // being restored from the backend — useIsOrganizationMember would read
  // that as "not a member" and permanently 404 a legitimate member. Wait
  // for the real answer instead of deciding on a stale/empty first render.
  if (isInitializing) return null;
  if (!isMember) notFound();

  if (!isActive) {
    return (
      <OrganizationDisabledState
        organizationName={organizationName ?? "This organization"}
      />
    );
  }

  return <>{children}</>;
}
