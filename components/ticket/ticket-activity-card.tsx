import { MessageSquare, RefreshCw, Send, Tag as TagIcon } from "lucide-react";
import Card from "@/components/ui/card";
import { SectionHeading } from "./section-heading";
import { TimelineStep } from "@/components/ui/timeline-step";
import { formatDate, formatRelative } from "@/lib/helper/format-date";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";

interface TicketActivityCardProps {
  tag: TagDetail;
  createdAt: string;
  updatedAt: string;
  comments?: TicketComment[];
}

export default function TicketActivityCard({
  tag,
  createdAt,
  updatedAt,
  comments = [],
}: TicketActivityCardProps) {
  const latestComment = comments.length
    ? comments.reduce((max, c) => (c.createdAt > max.createdAt ? c : max))
    : null;

  const hasUpdate = updatedAt !== createdAt;

  return (
    <Card>
      <SectionHeading icon={RefreshCw}>Activity</SectionHeading>

      <ol className="mt-4">
        <TimelineStep
          icon={Send}
          label="Ticket created"
          date={`${formatDate(createdAt)} · ${formatRelative(createdAt)}`}
          tone="done"
        />

        {latestComment && (
          <TimelineStep
            icon={MessageSquare}
            label={`${comments.length} comment${comments.length > 1 ? "s" : ""}`}
            date={`Latest ${formatRelative(latestComment.createdAt)}`}
            tone="done"
          />
        )}

        {hasUpdate && (
          <TimelineStep
            icon={RefreshCw}
            label="Last updated"
            date={`${formatDate(updatedAt)} · ${formatRelative(updatedAt)}`}
            tone="done"
          />
        )}

        <TimelineStep
          icon={TagIcon}
          label={`Currently ${tag.tagName}`}
          tone="done"
          accentColor={tag.color}
          isLast
        />
      </ol>
    </Card>
  );
}
