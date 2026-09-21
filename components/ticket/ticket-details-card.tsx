"use client";

import { UserPlus } from "lucide-react";

import Avatar from "@/components/ui/avatar";
import Card from "@/components/ui/card";
import MultiSelectDropdown from "@/components/ui/form/multi-select-dropdown";
import PropertyRow from "@/components/ui/property-row";
import { InlineButton } from "@/components/ui/buttons";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { usePermission } from "@/providers/auth-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { getMemberName } from "@/lib/helper/member-name";
import { formatDueDate, getDueState } from "@/lib/helper/ticket-status";
import { updateTicket } from "@/lib/api/tickets";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { TagPicker } from "./tag-picker";
import { DueChip } from "./due-chip";

interface TicketDetailsCardProps {
  ticketId: number;
  referenceId: string;
  ticketTitle: string;
  tag: TagDetail;
  onChangeTag: (tag: TagDetail) => void;
  client: MemberDetail | null;
  assignees: MemberDetail[];
  onAssigneesChange: (assignees: MemberDetail[]) => void;
  dueDate: string | null;
  onDueDateChange: (dueDate: string | null) => void;
  organization: OrganizationDetail;
}

export default function TicketDetailsCard({
  ticketId,
  referenceId,
  ticketTitle,
  tag,
  onChangeTag,
  client,
  assignees,
  onAssigneesChange,
  dueDate,
  onDueDateChange,
  organization,
}: TicketDetailsCardProps) {
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");
  const canChangeStatus = usePermission(PERMISSIONS.TICKET_CHANGE_STATUS);
  const assignableMembers = organization.members.filter(
    (m) => m.role?.roleName !== "Client",
  );

  const dueState = getDueState({ tag, dueDate });
  // en-CA formats as YYYY-MM-DD, what <input type="date"> needs — and
  // using the local calendar date (not toISOString, which is UTC) so the
  // cutoff matches what the user sees as "today".
  const todayStr = new Date().toLocaleDateString("en-CA");

  function handleChangeTag(nextTag: TagDetail) {
    const previousTag = tag;
    onChangeTag(nextTag);

    updateTicket(ticketId, { tagId: nextTag.id }).catch((error) => {
      onChangeTag(previousTag);
      notifyApiError(toast, error, "Failed to update status");
    });

    logTicketActivity({
      orgId: organization.id,
      action: "status_changed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      involvedUserIds: [client?.user?.id, ...assignees.map((a) => a.user?.id)],
      description: `changed status of "${ticketTitle}" to ${nextTag.tagName}`,
    });
  }

  function handleAssign(memberIds: number[]) {
    const previousAssignees = assignees;
    const newAssignees = assignableMembers.filter((m) =>
      memberIds.includes(m.id),
    );
    onAssigneesChange(newAssignees);

    updateTicket(ticketId, { assigneeIds: memberIds }).catch((error) => {
      onAssigneesChange(previousAssignees);
      notifyApiError(toast, error, "Failed to update assignees");
    });

    logTicketActivity({
      orgId: organization.id,
      action: "assigned",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      involvedUserIds: [
        client?.user?.id,
        ...assignees.map((a) => a.user?.id),
        ...newAssignees.map((a) => a.user?.id),
      ],
      description: `updated assignees on "${ticketTitle}"`,
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
      orgId: organization.id,
      action: "due_date_changed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      involvedUserIds: [client?.user?.id, ...assignees.map((a) => a.user?.id)],
      description: value
        ? `changed due date of "${ticketTitle}" to ${value}`
        : `cleared the due date on "${ticketTitle}"`,
    });
  }

  return (
    <Card title="Details" subtitle="Status, people, and dates.">
      <div className="space-y-4">
        <PropertyRow label="Status">
          {canChangeStatus ? (
            <TagPicker
              value={tag}
              options={organization.tags}
              onChange={handleChangeTag}
            />
          ) : (
            <span className="flex items-center gap-1.5 rounded-sm border border-line px-2 py-1 text-xs text-ink">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.tagName}
            </span>
          )}
        </PropertyRow>

        <Can action={PERMISSIONS.TICKET_ASSIGN}>
          <PropertyRow label="Assignees">
            <MultiSelectDropdown
              isWidthFull
              value={assignees.map((m) => m.id)}
              onChange={handleAssign}
              options={assignableMembers.map((m) => ({
                value: m.id,
                label: getMemberName(m),
              }))}
              emptyMessage="No assignable members"
              trigger={
                assignees.length === 0 ? (
                  <InlineButton icon={<UserPlus size={12} />}>
                    Assign
                  </InlineButton>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {assignees.map((member) => (
                      <span
                        key={member.id}
                        className="flex items-center gap-1.5 rounded-full bg-canvas py-0.5 pl-0.5 pr-2.5 text-xs text-ink"
                      >
                        <Avatar
                          firstName={member.user?.firstName ?? member.firstName}
                          lastName={member.user?.lastName ?? member.lastName}
                          size="sm"
                        />
                        {getMemberName(member)}
                      </span>
                    ))}
                  </div>
                )
              }
            />
          </PropertyRow>
        </Can>

        <PropertyRow label="Client">
          {client ? (
            <div className="flex items-center gap-2 text-sm text-ink">
              <Avatar
                firstName={client.user?.firstName ?? client.firstName}
                lastName={client.user?.lastName ?? client.lastName}
                size="sm"
              />
              {getMemberName(client)}
            </div>
          ) : (
            <span className="text-sm text-ink-faint">No client</span>
          )}
        </PropertyRow>

        <PropertyRow label="Due date">
          <div className="flex items-center gap-2">
            <input
              type="date"
              // dueDate from the API is a full ISO timestamp
              // ("2026-09-19T09:25:34.338Z"); a date input's value must be
              // bare "YYYY-MM-DD" or the browser treats it as invalid and
              // renders blank, even though a due date is actually set.
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
