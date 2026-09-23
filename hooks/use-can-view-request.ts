"use client";

import { useAuth, hasPermission } from "@/providers/auth-provider";
import { REQUEST_ALL_PERMISSIONS, REQUEST_OWN_PERMISSIONS } from "@/lib/data/permissions";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";

interface RequestAccessInfo {
  client: MemberDetail;
}

export function useCanViewRequest(request: RequestAccessInfo): boolean {
  const { currentUser, activeMembership } = useAuth();

  if (!activeMembership) return false;

  const rules = activeMembership.role.rules;

  if (REQUEST_ALL_PERMISSIONS.some((p) => hasPermission(rules, p))) {
    return true;
  }
  if (!REQUEST_OWN_PERMISSIONS.some((p) => hasPermission(rules, p))) {
    return false;
  }

  return request.client.user?.id === currentUser?.id;
}
