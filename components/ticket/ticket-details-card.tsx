"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import Avatar from "@/components/ui/avatar";
import Card from "@/components/ui/card";
import MultiSelectDropdown from "@/components/ui/form/multi-select-dropdown";
import PropertyRow from "@/components/ui/property-row";
import { InlineButton } from "@/components/ui/buttons";
import { useToast } from "@/providers/toast-provider";
import { getMemberName } from "@/lib/helper/member-name";
import { formatDueDate, getDueState } from "@/lib/helper/ticket-status";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { TagPicker } from "./tag-picker";
import { DueChip } from "./due-chip";

interface TicketDetailsCardProps {
  tag: TagDetail;
  client: MemberDetail | null;
  assignees: MemberDetail[];
  dueDate: string | null;
  organization: OrganizationDetail;
}

export default function TicketDetailsCard({
  tag: initialTag,
  client,
  assignees: initialAssignees,
  dueDate: initialDueDate,
  organization,
}: TicketDetailsCardProps) {
  const toast = useToast();
  const assignableMembers = organization.members.filter(
    (m) => m.role?.roleName !== "Client",
  );

  const [tag, setTag] = useState(initialTag);
  const [assignees, setAssignees] = useState(initialAssignees);
  const [dueDate, setDueDate] = useState(initialDueDate);

  const dueState = getDueState({ tag, dueDate });

  function handleChangeTag(nextTag: TagDetail) {
    setTag(nextTag);
    toast(`Status changed to "${nextTag.tagName}"`);
    // TODO: PATCH /tickets/:id { tag_id: nextTag.id }
  }

  function handleAssign(memberIds: number[]) {
    setAssignees(assignableMembers.filter((m) => memberIds.includes(m.id)));
    toast("Assignees updated");
    // TODO: PATCH /tickets/:id { assignee_ids: memberIds }
  }

  function handleDueDateChange(value: string) {
    setDueDate(value || null);
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
