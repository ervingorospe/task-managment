import { useMemo } from "react";
import {
  MessageSquare,
  Paperclip,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
} from "lucide-react";
import Card from "@/components/ui/card";
import { SectionHeading } from "./section-heading";
import { TimelineStep } from "@/components/ui/timeline-step";
import { formatDate, formatRelative } from "@/lib/helper/format-date";
import { useActivityLog } from "@/providers/activity-log-provider";

interface TicketActivityCardProps {
  ticketId: number;
  createdAt: string;
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
  attachment_added: Paperclip,
  attachment_removed: Paperclip,
};

interface Step {
  key: string;
  icon: typeof Send;
  label: string;
  date?: string;
}

/** Sourced from the org's Activity Log, filtered to this ticket — not its own local state. */
export default function TicketActivityCard({
  ticketId,
  createdAt,
}: TicketActivityCardProps) {
  const { entries } = useActivityLog();

  // Newest first, so the latest activity reads at the top.
  const ticketEntries = useMemo(
    () =>
      entries
        .filter((e) => e.module === "ticket" && e.entityId === ticketId)
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
    [entries, ticketId],
  );

  // "Created" anchors to the ticket's origin, not to whatever's happening
  // now, so it's pinned as the last step below every other logged activity
  // (which already covers status changes etc.) rather than sorted in with
  // it.
  const loggedCreation = ticketEntries.find((e) => e.action === "created");
  const otherEntries = ticketEntries.filter((e) => e.action !== "created");

  const steps: Step[] = [
    ...otherEntries.map((entry) => ({
      key: String(entry.id),
      icon: ACTION_ICON[entry.action] ?? RefreshCw,
      label: `${entry.actorName} ${entry.description}`,
      date: `${formatDate(entry.createdAt)} · ${formatRelative(entry.createdAt)}`,
    })),
    // The activity log only goes back to when logging was added, so older
    // tickets (or ones created outside the normal flow, e.g. bulk-seeded)
    // have no "created" entry in it — fall back to the ticket's own
    // createdAt so every ticket still shows when it was made.
    loggedCreation
      ? {
          key: String(loggedCreation.id),
          icon: Send,
          label: `${loggedCreation.actorName} ${loggedCreation.description}`,
          date: `${formatDate(loggedCreation.createdAt)} · ${formatRelative(loggedCreation.createdAt)}`,
        }
      : {
          key: "created-fallback",
          icon: Send,
          label: "Ticket created",
          date: `${formatDate(createdAt)} · ${formatRelative(createdAt)}`,
        },
  ];

  return (
    <Card>
      <SectionHeading icon={RefreshCw}>Activity</SectionHeading>

      <ol className="mt-4">
        {steps.map((step, i) => (
          <TimelineStep
            key={step.key}
            icon={step.icon}
            label={step.label}
            date={step.date}
            tone="done"
            isLast={i === steps.length - 1}
          />
        ))}
      </ol>
    </Card>
  );
}
