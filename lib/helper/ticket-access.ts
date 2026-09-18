import type { MemberDetail } from "../types/organization/member-detail.type";

interface TicketAccessInfo {
  client: MemberDetail | null;
  assignees: MemberDetail[];
}

/**
 * A ticket is "included" for a user if they're the requester (client) or
 * one of the assignees — mirrors the ticket.view.included rule description.
 */
export function isTicketIncluded(
  ticket: TicketAccessInfo,
  userId: number | undefined | null,
): boolean {
  if (!userId) return false;
  if (ticket.client?.user?.id === userId) return true;
  return ticket.assignees.some((member) => member.user?.id === userId);
}
