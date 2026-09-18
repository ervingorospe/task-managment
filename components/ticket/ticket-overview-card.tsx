import Card from "@/components/ui/card";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import TicketDescriptionSection from "./ticket-description-section";
import TicketAttachmentsSection from "./ticket-attachments-section";
import TicketCommentsSection from "./ticket-comments-section";

interface TicketOverviewCardProps {
  ticketId: number;
  description?: string;
  attachments: TicketAttachment[];
  comments?: TicketComment[];
}

export default function TicketOverviewCard({
  ticketId,
  description,
  attachments,
  comments,
}: TicketOverviewCardProps) {
  return (
    <Card
      title="Overview"
      subtitle="Description, attachments, and the discussion around this ticket."
    >
      <div className="space-y-6">
        <TicketDescriptionSection description={description} />

        <div className="border-t border-line" />

        <TicketAttachmentsSection attachments={attachments} />

        <div className="border-t border-line" />

        <TicketCommentsSection ticketId={ticketId} comments={comments} />
      </div>
    </Card>
  );
}
