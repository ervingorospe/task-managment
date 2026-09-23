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

const SUPERADMIN_ROLE_ID = 1;

export function Can({
  action,
  anyOf,
  allOf,
  children,
  fallback = null,
}: CanProps) {
  const { activeMembership, isPersonalMode } = useAuth();

  const rules = activeMembership?.role.rules ?? [];
  const isSuperAdmin = activeMembership?.role.id === SUPERADMIN_ROLE_ID;

  const passesAction = action ? hasPermission(rules, action) : true;

  const passesAny = anyOf
    ? anyOf.some((permission) => hasPermission(rules, permission))
    : true;

  const passesAll = allOf
    ? allOf.every((permission) => hasPermission(rules, permission))
    : true;

  // No team to restrict against in Personal mode — same bypass as
  // usePermission() and the same reasoning as the Superadmin bypass above.
  const allowed =
    isPersonalMode ||
    isSuperAdmin ||
    (passesAction && passesAny && passesAll);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/permissions";

<Can action={PERMISSIONS.ROLE_ADD}>
  <Button onClick={openCreateModal}>Add role</Button>
</Can>

<Can anyOf={[PERMISSIONS.MEMBER_VIEW_ADMINS, PERMISSIONS.MEMBER_VIEW_MEMBERS]}>
  <MembersTable />
</Can>
 */
