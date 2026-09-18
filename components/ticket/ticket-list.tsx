"use client";

import Link from "next/link";
import Tooltip from "@/components/ui/tooltip";
import Avatar from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { TagPicker } from "./tag-picker";
import TicketDescriptionCell from "./ticket-description-cell";
import MultiSelectDropdown from "@/components/ui/form/multi-select-dropdown";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { InlineButton } from "@/components/ui/buttons";

interface TicketListProps {
  tickets: TicketDetail[];
  availableTags: TagDetail[];
  assignableMembers: MemberDetail[];
  onChangeTag: (ticketId: number, tag: TagDetail) => void;
  onAssign: (ticketId: number, memberIds: number[]) => void;
}

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTimeframe(ticket: TicketDetail) {
  if (!ticket.dueDate) return null;
  return `Due on ${formatDate(ticket.dueDate) ?? "—"}`;
}

function getDueState(ticket: TicketDetail): "overdue" | "due-today" | null {
  if (!ticket.dueDate) return null;
  if (["Done", "Cancelled"].includes(ticket.tag.tagName)) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (ticket.dueDate < today) return "overdue";
  if (ticket.dueDate === today) return "due-today";
  return null;
}

function DueChip({ state }: { state: "overdue" | "due-today" }) {
  const isOverdue = state === "overdue";
  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isOverdue
          ? "bg-danger-subtle text-danger"
          : "bg-warning-subtle text-warning"
      }`}
    >
      {isOverdue ? "Overdue" : "Due today"}
    </span>
  );
}

export function TicketList({
  tickets,
  availableTags,
  assignableMembers,
  onChangeTag,
  onAssign,
}: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded border border-dashed border-line p-10 text-center">
        <p className="text-sm font-medium text-ink">No tickets yet</p>
        <p className="mt-1 text-sm text-ink-muted">
          Create your first ticket to get started.
        </p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <tbody>
        {tickets.map((ticket) => {
          const timeframe = formatTimeframe(ticket);
          const dueState = getDueState(ticket);

          return (
            <tr
              key={ticket.id}
              className="border-b border-line align-top last:border-0"
            >
              {/* Title, with timeframe + due chip + client stacked below */}
              <td className="max-w-[70px] px-4 py-3">
                <Link
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="font-medium text-ink hover:text-accent-text"
                >
                  {ticket.title}
                </Link>
                <div className="mt-1 space-y-0.5 text-xs text-ink-muted">
                  {timeframe && (
                    <p className="flex items-center gap-1.5">
                      {timeframe}
                      {dueState && <DueChip state={dueState} />}
                    </p>
                  )}
                  {ticket.client?.user && (
                    <p>
                      Client: {ticket.client.user.firstName}{" "}
                      {ticket.client.user.lastName}
                    </p>
                  )}
                </div>
              </td>

              {/* Description — markdown, clamped, "View more" links to the ticket page */}
              <td className="max-w-[140px] px-4 py-3">
                <TicketDescriptionCell
                  ticketId={ticket.id}
                  description={ticket.description}
                  attachments={ticket.attachments}
                />
              </td>

              {/* Assignees — clickable avatars with tooltip, or inline "Assign" when empty */}
              <td className="max-w-[40px] px-4 py-3">
                <MultiSelectDropdown
                  value={ticket.assignees.map((member) => member.id)}
                  onChange={(memberIds) => onAssign(ticket.id, memberIds)}
                  options={assignableMembers.map((member) => ({
                    value: member.id,
                    label: `${member.user?.firstName ?? ""} ${
                      member.user?.lastName ?? ""
                    }`.trim(),
                  }))}
                  emptyMessage="No assignable members"
                  trigger={
                    ticket.assignees.length === 0 ? (
                      <InlineButton icon={<UserPlus size={12} />}>
                        Assign
                      </InlineButton>
                    ) : (
                      <div className="flex -space-x-2">
                        {ticket.assignees.map((member) => (
                          <Tooltip
                            key={member.id}
                            label={`${member.user?.firstName ?? ""} ${
                              member.user?.lastName ?? ""
                            }`.trim()}
                          >
                            <Avatar
                              firstName={member.user?.firstName ?? "?"}
                              lastName={member.user?.lastName}
                              size="sm"
                              className="cursor-pointer ring-2 ring-surface transition-transform hover:z-10 hover:scale-110"
                            />
                          </Tooltip>
                        ))}
                      </div>
                    )
                  }
                />
              </td>

              {/* Change tag */}
              <td className="max-w-[40px] whitespace-nowrap px-4 py-3">
                <TagPicker
                  value={ticket.tag}
                  options={availableTags}
                  onChange={(tag) => onChangeTag(ticket.id, tag)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
