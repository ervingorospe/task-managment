import { notFound } from "next/navigation";
import { getTicketById } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import TicketAccessGuard from "@/components/auth/ticket-access-guard";
import PersonalTicketAccessGuard from "@/components/auth/personal-ticket-access-guard";
import TicketDetailClient from "@/components/ticket/ticket-detail-client";
import PersonalTicketDetailClient from "@/components/ticket/personal-ticket-detail-client";

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

  if (!organization) {
    return (
      <PersonalTicketAccessGuard ownerId={ticket.ownerId}>
        <PersonalTicketDetailClient ticket={ticket} />
      </PersonalTicketAccessGuard>
    );
  }

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
