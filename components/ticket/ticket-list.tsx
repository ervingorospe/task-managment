"use client";

import { memo } from "react";
import Link from "next/link";
import Tooltip from "@/components/ui/tooltip";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { Star, UserPlus } from "lucide-react";
import { TagPicker } from "./tag-picker";
import TicketDescriptionCell from "./ticket-description-cell";
import { DueChip } from "./due-chip";
import MultiSelectDropdown from "@/components/ui/form/multi-select-dropdown";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import { InlineButton } from "@/components/ui/buttons";
import { formatDueDate, getDueState } from "@/lib/helper/ticket-status";

interface TicketListProps {
  tickets: TicketDetail[];
  availableTags: TagDetail[];
  assignableMembers: MemberDetail[];
  onChangeTag: (ticketId: number, tag: TagDetail) => void;
  onAssign: (ticketId: number, memberIds: number[]) => void;
  onToggleStar: (ticketId: number) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
}

function formatTimeframe(ticket: TicketDetail) {
  if (!ticket.dueDate) return null;
  return `Due on ${formatDueDate(ticket.dueDate) ?? "—"}`;
}

function TicketListComponent({
  tickets,
  availableTags,
  assignableMembers,
  onChangeTag,
  onAssign,
  onToggleStar,
  emptyTitle = "No tickets yet",
  emptySubtitle = "Create your first ticket to get started.",
}: TicketListProps) {
  if (tickets.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
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
              {/* Star toggle */}
              <td className="w-8 px-4 py-3 align-middle">
                <button
                  type="button"
                  onClick={() => onToggleStar(ticket.id)}
                  aria-label={ticket.starred ? "Unstar ticket" : "Star ticket"}
                  aria-pressed={ticket.starred}
                  className="text-ink-faint transition-colors hover:text-warning"
                >
                  <Star
                    size={16}
                    className={ticket.starred ? "fill-warning text-warning" : ""}
                  />
                </button>
              </td>

              {/* Reference id */}
              <td className="w-20 whitespace-nowrap px-2 py-3 align-middle">
                <Link
                  href={`/dashboard/tickets/${ticket.id}`}
                  className="font-mono text-xs text-ink-muted hover:text-accent-text"
                >
                  {ticket.referenceId}
                </Link>
              </td>

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

export const TicketList = memo(TicketListComponent);
