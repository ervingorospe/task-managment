import Card from "@/components/ui/card";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import TicketDescriptionSection from "./ticket-description-section";
import TicketAttachmentsSection from "./ticket-attachments-section";
import TicketCommentsSection from "./ticket-comments-section";

interface TicketOverviewCardProps {
  ticketId: number;
  description?: string;
  attachments: TicketAttachment[];
  comments?: TicketComment[];
  client: MemberDetail | null;
  assignees: MemberDetail[];
  organization: OrganizationDetail;
}

export default function TicketOverviewCard({
  ticketId,
  description,
  attachments,
  comments,
  client,
  assignees,
  organization,
}: TicketOverviewCardProps) {
  return (
    <Card
      title="Overview"
      subtitle="Description, attachments, and the discussion around this ticket."
    >
      <div className="space-y-6">
        <TicketDescriptionSection ticketId={ticketId} description={description} />

        <div className="border-t border-line" />

        <TicketAttachmentsSection
          ticketId={ticketId}
          attachments={attachments}
          client={client}
          assignees={assignees}
          organization={organization}
        />

        <div className="border-t border-line" />

        <TicketCommentsSection
          ticketId={ticketId}
          comments={comments}
          client={client}
          assignees={assignees}
          organization={organization}
        />
      </div>
    </Card>
  );
}
