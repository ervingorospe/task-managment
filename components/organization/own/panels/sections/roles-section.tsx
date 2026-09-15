"use client";

import { useState } from "react";
import type { RoleFormValues } from "@/lib/schemas/organization.schema";
import RoleManager from "@/components/organization/role/role-manager";
import { lazyNamed } from "@/lib/helper/lazy-named";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { resolveRules } from "@/lib/helper/resolve-rules";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

interface RolesSectionProps {
  roles: RoleDetail[];
  capacity: number;
  orgId: string | number;
}

// Turns the form's selected rule ids into the full Rule objects RoleDetail
// expects. Any id that somehow doesn't match a known rule is dropped rather
// than producing a broken/partial Rule in state.

export default function RolesSection({
  roles: initialRoles,
  capacity,
  orgId,
}: RolesSectionProps) {
  const [roles, setRoles] = useState<RoleDetail[]>(initialRoles);
  const [deletingRole, setDeletingRole] = useState<RoleDetail | null>(null);

  function addRole(values: RoleFormValues): string | undefined {
    if (
      roles.some(
        (r) => r.role_name.toLowerCase() === values.role_name.toLowerCase(),
      )
    ) {
      return `A role named "${values.role_name}" already exists`;
    }

    const newRole: RoleDetail = {
      id: Date.now(),
      role_name: values.role_name,
      role_desc: values.role_desc ?? "",
      rules: resolveRules(values.rules),
      isDefault: false,
      org_id: Number(orgId),
      isDeleted: false,
      isLocked: false,
    };

    setRoles((prev) => [...prev, newRole]);
    // TODO: POST /organizations/:orgId/roles in the background.
    return undefined;
  }

  function updateRole(id: number, values: RoleFormValues): string | undefined {
    if (
      roles.some(
        (r) =>
          r.id !== id &&
          r.role_name.toLowerCase() === values.role_name.toLowerCase(),
      )
    ) {
      return `A role named "${values.role_name}" already exists`;
    }

    setRoles((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              role_name: values.role_name,
              role_desc: values.role_desc ?? "",
              rules: resolveRules(values.rules),
            }
          : r,
      ),
    );
    // TODO: PATCH /organizations/:orgId/roles/:id in the background.
    return undefined;
  }

  function handleConfirmDelete() {
    if (!deletingRole) return;
    setRoles((prev) => prev.filter((r) => r.id !== deletingRole.id));
    setDeletingRole(null);
    // TODO: DELETE /organizations/:orgId/roles/:id
  }

  return (
    <section className="rounded border border-line bg-surface p-5">
      <RoleManager
        title="Roles"
        subtitle="Manage the roles and permissions available in this organization."
        roles={roles}
        capacity={capacity}
        addRole={addRole}
        updateRole={updateRole}
        onDeleteRole={setDeletingRole}
      />

      {deletingRole && (
        <Can action={PERMISSIONS.ROLE_REMOVE}>
          <ConfirmDialog
            open={deletingRole !== null}
            onClose={() => setDeletingRole(null)}
            onConfirm={handleConfirmDelete}
            title={`Delete "${deletingRole.role_name}" role?`}
            confirmLabel="Delete role"
            description={
              <>
                This role will be permanently deleted and can&apos;t be
                recovered from this screen. Any members currently assigned this
                role will automatically be moved to the{" "}
                <span className="font-medium text-ink">Member</span> role.
              </>
            }
          />
        </Can>
      )}
    </section>
  );
}
