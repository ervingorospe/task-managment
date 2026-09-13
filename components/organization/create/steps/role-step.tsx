"use client";

import { useCallback } from "react";
import { useStepForm } from "@/hooks/use-step-form";
import RoleManager from "@/components/organization/role/role-manager";
import { RoleFormValues, rolesSchema } from "@/lib/schemas/organization.schema";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { resolveRules } from "@/lib/helper/resolve-rules";

export default function RolesStep() {
  const { roles: defaultRoles } = useOrganizationDefaults();
  const { watch, setValue } = useStepForm(rolesSchema, {
    roles: defaultRoles,
  });

  const roles = (watch("roles") as RoleDetail[] | undefined) ?? defaultRoles;

  const addRole = useCallback(
    (values: RoleFormValues): string | undefined => {
      const roleName = values.role_name.trim();

      const roleExists = roles.some(
        (role) => role.role_name.toLowerCase() === roleName.toLowerCase(),
      );

      if (roleExists) {
        return `A role named "${roleName}" already exists.`;
      }

      const newRole: RoleDetail = {
        id: Date.now(),
        role_name: roleName,
        role_desc: values.role_desc?.trim() ?? "",
        rules: resolveRules(values.rules),
        isDefault: false,
        isLocked: false,
        isDeleted: false,
        org_id: null,
      };

      setValue("roles", [...roles, newRole], {
        shouldValidate: true,
        shouldDirty: true,
      });

      return undefined;
    },
    [roles, setValue],
  );

  const updateRole = useCallback(
    (id: number, values: RoleFormValues): string | undefined => {
      const roleName = values.role_name.trim();

      const roleExists = roles.some(
        (role) =>
          role.id !== id &&
          role.role_name.toLowerCase() === roleName.toLowerCase(),
      );

      if (roleExists) {
        return `A role named "${roleName}" already exists.`;
      }

      setValue(
        "roles",
        roles.map((role) =>
          role.id === id
            ? {
                ...role,
                role_name: values.role_name,
                role_desc: values.role_desc ?? "",
                rules: resolveRules(values.rules),
              }
            : role,
        ),
        { shouldValidate: true, shouldDirty: true },
      );

      return undefined;
    },
    [roles, setValue],
  );

  // No confirmation here, on purpose — nothing exists yet during setup to
  // warn about (no real members can hold this role before the org exists).
  // RolesSection is where the same delete has a real consequence, so
  // that's where ConfirmDialog belongs.
  const onDeleteRole = useCallback(
    (role: RoleDetail) => {
      setValue(
        "roles",
        roles.filter((r) => r.id !== role.id),
        { shouldValidate: true, shouldDirty: true },
      );
    },
    [roles, setValue],
  );

  return (
    <RoleManager
      title="Set Up Roles"
      subtitle="Create roles and define what members can do in your organization."
      roles={roles}
      addRole={addRole}
      updateRole={updateRole}
      onDeleteRole={onDeleteRole}
    />
  );
}
