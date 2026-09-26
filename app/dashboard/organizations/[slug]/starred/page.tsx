"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { MemberRemovedState } from "@/components/organization/member-removed-state";
import TicketsPageClient from "@/components/ticket/tickets-page-client";
import Loading from "./loading";

export default function StarredPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading } = useOrganizationBySlug(slug);
  const membership = useMembershipBySlug(slug);

  if (loading) return <Loading />;
  // See tickets/page.tsx's identical check for why this can't just rely
  // on MemberGuard — the org fetch 403s for a deactivated membership
  // before MemberGuard ever gets an organization.id to check.
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
      <TicketsPageClient organization={organization} starredOnly />
    </MemberGuard>
  );
}
