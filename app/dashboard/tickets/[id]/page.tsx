import { notFound } from "next/navigation";
import { getTicketById } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import TicketAccessGuard from "@/components/auth/ticket-access-guard";
import TicketDetailClient from "@/components/ticket/ticket-detail-client";

interface TicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const ticketId = Number(id);

  if (!Number.isFinite(ticketId)) notFound();

  const result = await getTicketById(ticketId);
  if (!result) notFound();

  const { ticket, organization } = result;

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <TicketAccessGuard ticket={ticket}>
        <TicketDetailClient ticket={ticket} organization={organization} />
      </TicketAccessGuard>
    </MemberGuard>
  );
}
