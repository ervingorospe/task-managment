"use client";

import { useParams, notFound } from "next/navigation";
import { useTicketById } from "@/hooks/use-ticket-by-id";
import MemberGuard from "@/components/auth/member-guard";
import TicketAccessGuard from "@/components/auth/ticket-access-guard";
import PersonalTicketAccessGuard from "@/components/auth/personal-ticket-access-guard";
import TicketDetailClient from "@/components/ticket/ticket-detail-client";
import PersonalTicketDetailClient from "@/components/ticket/personal-ticket-detail-client";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Loading from "./loading";

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);

  const { ticket, organization, loading, notFound: ticketNotFound } =
    useTicketById(ticketId);
  useDocumentTitle(ticket?.title);

  if (!Number.isFinite(ticketId)) notFound();
  if (loading) return <Loading />;
  if (ticketNotFound || !ticket) notFound();

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
