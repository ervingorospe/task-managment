"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import Avatar from "@/components/ui/avatar";
import Card from "@/components/ui/card";
import MultiSelectDropdown from "@/components/ui/form/multi-select-dropdown";
import PropertyRow from "@/components/ui/property-row";
import { InlineButton } from "@/components/ui/buttons";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { getMemberName } from "@/lib/helper/member-name";
import { formatDueDate, getDueState } from "@/lib/helper/ticket-status";
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
  assignees: initialAssignees,
  dueDate,
  onDueDateChange,
  organization,
}: TicketDetailsCardProps) {
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");
  const assignableMembers = organization.members.filter(
    (m) => m.role?.roleName !== "Client",
  );

  const [assignees, setAssignees] = useState(initialAssignees);

  const dueState = getDueState({ tag, dueDate });

  function handleChangeTag(nextTag: TagDetail) {
    onChangeTag(nextTag);
    logTicketActivity({
      orgId: organization.id,
      action: "status_changed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      referenceId,
      involvedUserIds: [client?.user?.id, ...assignees.map((a) => a.user?.id)],
      description: `changed status of "${ticketTitle}" to ${nextTag.tagName}`,
    });
    toast(`Status changed to "${nextTag.tagName}"`);
    // TODO: PATCH /tickets/:id { tag_id: nextTag.id }
  }

  function handleAssign(memberIds: number[]) {
    const newAssignees = assignableMembers.filter((m) =>
      memberIds.includes(m.id),
    );
    setAssignees(newAssignees);
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
    toast("Assignees updated");
    // TODO: PATCH /tickets/:id { assignee_ids: memberIds }
  }

  function handleDueDateChange(value: string) {
    onDueDateChange(value || null);
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
    toast(value ? "Due date updated" : "Due date cleared");
    // TODO: PATCH /tickets/:id { due_date: value }
  }

  return (
    <Card title="Details" subtitle="Status, people, and dates.">
      <div className="space-y-4">
        <PropertyRow label="Status">
          <TagPicker
            value={tag}
            options={organization.tags}
            onChange={handleChangeTag}
          />
        </PropertyRow>

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
              value={dueDate ?? ""}
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
