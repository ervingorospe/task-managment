"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { MemberRemovedState } from "@/components/organization/member-removed-state";
import TicketsPageClient from "@/components/ticket/tickets-page-client";
import Loading from "./loading";

export default function TicketsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading } = useOrganizationBySlug(slug);
  const membership = useMembershipBySlug(slug);

  if (loading) return <Loading />;
  // The org detail fetch 403s (and organization stays null) for a
  // deactivated membership — same underlying cause as MemberGuard's
  // "deactivated" state, but that never gets a chance to run here since it
  // needs a successfully-fetched organization.id. Check membership status
  // from currentUser.memberships (no fetch needed) before falling back to
  // a plain 404.
  if (membership && !membership.isActive) {
    return (
      <MemberRemovedState organizationName={membership.organization.organizationName} />
    );
  }
  if (!organization) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <TicketsPageClient organization={organization} />
    </MemberGuard>
  );
}
