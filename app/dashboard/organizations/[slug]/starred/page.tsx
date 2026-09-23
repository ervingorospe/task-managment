"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import TicketsPageClient from "@/components/ticket/tickets-page-client";
import Loading from "./loading";

export default function StarredPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading } = useOrganizationBySlug(slug);

  if (loading) return <Loading />;
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
