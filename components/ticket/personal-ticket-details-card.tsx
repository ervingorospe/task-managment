"use client";

import Card from "@/components/ui/card";
import PropertyRow from "@/components/ui/property-row";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { formatDueDate, getDueState } from "@/lib/helper/ticket-status";
import { getTodayInTimeZone } from "@/lib/helper/format-date";
import { updateTicket, updateTicketTag } from "@/lib/api/tickets";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { TagPicker } from "./tag-picker";
import { DueChip } from "./due-chip";

interface PersonalTicketDetailsCardProps {
  ticketId: number;
  referenceId: string;
  ticketTitle: string;
  tag: TagDetail;
  onChangeTag: (tag: TagDetail) => void;
  /** The fixed global tag set — a personal ticket has no org tags to
   * choose from. */
  tagOptions: TagDetail[];
  dueDate: string | null;
  onDueDateChange: (dueDate: string | null) => void;
}

/** Same shape as TicketDetailsCard, minus Assignees/Client — a personal
 * ticket has no org members to assign or a client to attach. */
export default function PersonalTicketDetailsCard({
  ticketId,
  referenceId,
  ticketTitle,
  tag,
  onChangeTag,
  tagOptions,
  dueDate,
  onDueDateChange,
}: PersonalTicketDetailsCardProps) {
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");

  const dueState = getDueState({ tag, dueDate });
  // No org timezone in Personal mode — falls back to the browser's.
  const todayStr = getTodayInTimeZone();

  function handleChangeTag(nextTag: TagDetail) {
    const previousTag = tag;
    onChangeTag(nextTag);

    updateTicketTag(ticketId, nextTag.id).catch((error) => {
      onChangeTag(previousTag);
      notifyApiError(toast, error, "Failed to update status");
    });

    logTicketActivity({
      action: "status_changed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      description: `changed status of "${ticketTitle}" to ${nextTag.tagName}`,
    });
  }

  function handleDueDateChange(value: string) {
    const previousDueDate = dueDate;
    onDueDateChange(value || null);

    updateTicket(ticketId, { dueDate: value || null }).catch((error) => {
      onDueDateChange(previousDueDate);
      notifyApiError(toast, error, "Failed to update due date");
    });

    logTicketActivity({
      action: "due_date_changed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      description: value
        ? `changed due date of "${ticketTitle}" to ${value}`
        : `cleared the due date on "${ticketTitle}"`,
    });
  }

  return (
    <Card title="Details" subtitle="Status and dates.">
      <div className="space-y-4">
        <PropertyRow label="Status">
          <TagPicker value={tag} options={tagOptions} onChange={handleChangeTag} />
        </PropertyRow>

        <PropertyRow label="Due date">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dueDate ? dueDate.slice(0, 10) : ""}
              min={todayStr}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-accent-text focus:outline-none"
            />
            {dueState && <DueChip state={dueState} />}
          </div>
          {dueDate && (
            <p className="mt-1 text-xs text-ink-faint">
              {formatDueDate(dueDate)}
            </p>
          )}
        </PropertyRow>
      </div>
    </Card>
  );
}
