"use client";

import type { ReactNode } from "react";
import { useAuth, hasPermission } from "@/providers/auth-provider";
import type { Permission } from "@/lib/data/permissions";

interface CanProps {
  /** Single permission required. */
  action?: Permission;
  /** User needs ANY one of these. */
  anyOf?: Permission[];
  /** User needs ALL of these. */
  allOf?: Permission[];
  children: ReactNode;
  /** Rendered instead of nothing when the check fails. */
  fallback?: ReactNode;
}

export function Can({
  action,
  anyOf,
  allOf,
  children,
  fallback = null,
}: CanProps) {
  const { activeMembership, isPersonalMode } = useAuth();

  const rules = activeMembership?.role.rules ?? [];

  const passesAction = action ? hasPermission(rules, action) : true;

  const passesAny = anyOf
    ? anyOf.some((permission) => hasPermission(rules, permission))
    : true;

  const passesAll = allOf
    ? allOf.every((permission) => hasPermission(rules, permission))
    : true;

  // No team to restrict against in Personal mode — same bypass
  // usePermission() uses. No separate Superadmin bypass needed: the
  // Superadmin role is seeded with every single Rule connected (see
  // prisma/seed.ts), so it already passes any real permission check on
  // its own — a role-id shortcut here would just be redundant and, worse,
  // fragile (nothing guarantees Superadmin's row id is always 1).
  const allowed = isPersonalMode || (passesAction && passesAny && passesAll);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * import { Can } from "@/components/auth/can";
 * import { PERMISSIONS } from "@/lib/data/permissions";
 *
 * <Can action={PERMISSIONS.ROLE_ADD}>
 *   <Button onClick={openCreateModal}>Add role</Button>
 * </Can>
 *
 * <Can anyOf={[PERMISSIONS.MEMBER_VIEW_OWNER, PERMISSIONS.MEMBER_VIEW_MEMBERS]}>
 *   <MembersTable />
 * </Can>
 */
