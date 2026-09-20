import { useMemo } from "react";
import {
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Tag as TagIcon,
  Trash2,
  UserPlus,
} from "lucide-react";
import Card from "@/components/ui/card";
import { SectionHeading } from "./section-heading";
import { TimelineStep } from "@/components/ui/timeline-step";
import { formatDate, formatRelative } from "@/lib/helper/format-date";
import { useActivityLog } from "@/providers/activity-log-provider";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface TicketActivityCardProps {
  ticketId: number;
  tag: TagDetail;
}

const ACTION_ICON: Record<string, typeof Send> = {
  created: Send,
  commented: MessageSquare,
  comment_edited: Pencil,
  comment_removed: Trash2,
  status_changed: RefreshCw,
  assigned: UserPlus,
  due_date_changed: RefreshCw,
  title_updated: Pencil,
  removed: Trash2,
};

/** Sourced from the org's Activity Log, filtered to this ticket — not its own local state. */
export default function TicketActivityCard({
  ticketId,
  tag,
}: TicketActivityCardProps) {
  const { entries } = useActivityLog();

  const ticketEntries = useMemo(
    () =>
      entries
        .filter((e) => e.module === "ticket" && e.entityId === ticketId)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [entries, ticketId],
  );

  return (
    <Card>
      <SectionHeading icon={RefreshCw}>Activity</SectionHeading>

      <ol className="mt-4">
        {ticketEntries.map((entry) => (
          <TimelineStep
            key={entry.id}
            icon={ACTION_ICON[entry.action] ?? RefreshCw}
            label={`${entry.actorName} ${entry.description}`}
            date={`${formatDate(entry.createdAt)} · ${formatRelative(entry.createdAt)}`}
            tone="done"
          />
        ))}

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
