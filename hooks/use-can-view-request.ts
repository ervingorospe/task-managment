"use client";

import { useAuth, hasPermission } from "@/providers/auth-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface RequestAccessInfo {
  client: MemberDetail;
}

/**
 * ticket.view.all sees every request; ticket.request only sees the ones
 * they submitted themselves. Neither permission means no access.
 */
export function useCanViewRequest(request: RequestAccessInfo): boolean {
  const { currentUser, activeMembership } = useAuth();

  if (!activeMembership) return false;

  const rules = activeMembership.role.rules;

  if (hasPermission(rules, PERMISSIONS.TICKET_VIEW_ALL)) return true;
  if (!hasPermission(rules, PERMISSIONS.TICKET_REQUEST)) return false;

  return request.client.user?.id === currentUser?.id;
}
