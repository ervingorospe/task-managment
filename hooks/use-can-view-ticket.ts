"use client";

import { useAuth, hasPermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import { isTicketIncluded } from "@/lib/helper/ticket-access";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface TicketAccessInfo {
  client: MemberDetail | null;
  assignees: MemberDetail[];
}

/**
 * ticket.view.all sees everything; ticket.view.included only sees tickets
 * they requested or are assigned to. Neither permission means no access.
 */
export function useCanViewTicket(ticket: TicketAccessInfo): boolean {
  const { currentUser, activeMembership } = useAuth();

  if (!activeMembership) return false;

  const rules = activeMembership.role.rules;

  if (hasPermission(rules, PERMISSIONS.TICKET_VIEW_ALL)) return true;
  if (!hasPermission(rules, PERMISSIONS.TICKET_VIEW_INCLUDED)) return false;

  return isTicketIncluded(ticket, currentUser?.id);
}
