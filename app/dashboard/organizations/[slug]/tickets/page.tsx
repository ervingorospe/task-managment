import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import TicketsPageClient from "@/components/ticket/tickets-page-client";

interface TicketsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

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
