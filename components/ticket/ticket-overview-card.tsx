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
  /** Current title/referenceId — used for activity-log descriptions.
   * Required for a personal ticket, since there's no organization.tickets
   * list to look them up from (see ticket-comments-section.tsx). */
  ticketTitle: string;
  referenceId: string;
  description?: string;
  attachments: TicketAttachment[];
  comments?: TicketComment[];
  client: MemberDetail | null;
  assignees: MemberDetail[];
  /** Null for a personal (org-less) ticket. */
  organization: OrganizationDetail | null;
  /** Personal tickets skip discussion entirely — it's just the owner,
   * there's no one to discuss it with. */
  hideComments?: boolean;
}

export default function TicketOverviewCard({
  ticketId,
  ticketTitle,
  referenceId,
  description,
  attachments,
  comments,
  client,
  assignees,
  organization,
  hideComments = false,
}: TicketOverviewCardProps) {
  return (
    <Card
      title="Overview"
      subtitle={
        hideComments
          ? "Description and attachments."
          : "Description, attachments, and the discussion around this ticket."
      }
    >
      <div className="space-y-6">
        <TicketDescriptionSection ticketId={ticketId} description={description} />

        <div className="border-t border-line" />

        <TicketAttachmentsSection
          ticketId={ticketId}
          ticketTitle={ticketTitle}
          referenceId={referenceId}
          attachments={attachments}
          client={client}
          assignees={assignees}
          organization={organization}
        />

        {!hideComments && (
          <>
            <div className="border-t border-line" />

            <TicketCommentsSection
              ticketId={ticketId}
              ticketTitle={ticketTitle}
              referenceId={referenceId}
              comments={comments}
              client={client}
              assignees={assignees}
              organization={organization}
            />
          </>
        )}
      </div>
    </Card>
  );
}
