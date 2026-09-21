"use client";

import { useState } from "react";
import type { RoleFormValues } from "@/lib/schemas/organization.schema";
import RoleManager from "@/components/organization/role/role-manager";
import { lazyNamed } from "@/lib/helper/lazy-named";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { resolveRules } from "@/lib/helper/resolve-rules";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import { createRole, updateRoleInfo, updateRoleRules, deleteRole } from "@/lib/api/roles";
import { notifyApiError } from "@/lib/helper/api-error-toast";

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
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logRoleActivity = useLogActivity("role");
  const { permissionOptions } = useOrganizationDefaults();
  const [roles, setRoles] = useState<RoleDetail[]>(initialRoles);
  const [deletingRole, setDeletingRole] = useState<RoleDetail | null>(null);

  function addRole(values: RoleFormValues): string | undefined {
    if (
      roles.some(
        (r) => r.roleName.toLowerCase() === values.roleName.toLowerCase(),
      )
    ) {
      return `A role named "${values.roleName}" already exists`;
    }

    const tempId = Date.now();
    const newRole: RoleDetail = {
      id: tempId,
      roleName: values.roleName,
      roleDesc: values.roleDesc ?? "",
      rules: resolveRules(values.rules, permissionOptions),
      isDefault: false,
      orgId: Number(orgId),
      isDeleted: false,
      isLocked: false,
    };

    setRoles((prev) => [...prev, newRole]);

    createRole(Number(orgId), {
      roleName: values.roleName,
      roleDesc: values.roleDesc,
      ruleIds: values.rules,
    })
      .then((created) => {
        setRoles((prev) => prev.map((r) => (r.id === tempId ? created : r)));
        logRoleActivity({
          orgId: Number(orgId),
          action: "created",
          entityId: created.id,
          entityLabel: created.roleName,
          description: `created role "${newRole.roleName}"`,
        });
        showAlert(`Role "${newRole.roleName}" added`);
      })
      .catch((error) => {
        setRoles((prev) => prev.filter((r) => r.id !== tempId));
        notifyApiError(toast, error, `Failed to create role "${values.roleName}"`);
      });

    return undefined;
  }

  function updateRole(id: number, values: RoleFormValues): string | undefined {
    if (
      roles.some(
        (r) =>
          r.id !== id &&
          r.roleName.toLowerCase() === values.roleName.toLowerCase(),
      )
    ) {
      return `A role named "${values.roleName}" already exists`;
    }

    const previous = roles.find((r) => r.id === id);

    setRoles((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              roleName: values.roleName,
              roleDesc: values.roleDesc ?? "",
              rules: resolveRules(values.rules, permissionOptions),
            }
          : r,
      ),
    );

    Promise.all([
      updateRoleInfo(id, { roleName: values.roleName, roleDesc: values.roleDesc }),
      updateRoleRules(id, values.rules),
    ])
      .then(() => {
        logRoleActivity({
          orgId: Number(orgId),
          action: "updated",
          entityId: id,
          entityLabel: values.roleName,
          description: `updated role "${values.roleName}"`,
        });
        showAlert(`Role "${values.roleName}" updated`);
      })
      .catch((error) => {
        if (previous) {
          setRoles((prev) => prev.map((r) => (r.id === id ? previous : r)));
        }
        notifyApiError(toast, error, `Failed to update role "${values.roleName}"`);
      });

    return undefined;
  }

  function handleConfirmDelete() {
    if (!deletingRole) return;
    const removed = deletingRole;
    setRoles((prev) => prev.filter((r) => r.id !== removed.id));
    setDeletingRole(null);

    deleteRole(removed.id)
      .then(() => {
        logRoleActivity({
          orgId: Number(orgId),
          action: "removed",
          entityId: removed.id,
          entityLabel: removed.roleName,
          description: `deleted role "${removed.roleName}"`,
        });
        showAlert(`Role "${removed.roleName}" deleted`, "error");
      })
      .catch((error) => {
        setRoles((prev) => [...prev, removed]);
        notifyApiError(toast, error, `Failed to delete role "${removed.roleName}"`);
      });
  }

  return (
    <section className="rounded border border-line bg-surface p-5">
      <RoleManager
        title="Roles"
        subtitle="Manage the roles and permissions available in this organization."
        banner={
          alert && (
            <InlineAlert
              message={alert.message}
              variant={alert.variant}
              onDismiss={dismissAlert}
            />
          )
        }
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
            title={`Delete "${deletingRole.roleName}" role?`}
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
