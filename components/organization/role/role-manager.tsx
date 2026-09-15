"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleFormValues } from "@/lib/schemas/organization.schema";
import RoleList from "@/components/organization/role/role-list";
import type { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

const RoleFormModal = dynamic(
  () =>
    import("@/components/organization/role/role-form-modal").then(
      (mod) => mod.RoleFormModal,
    ),
  { ssr: false },
);

interface RoleManagerProps {
  title: string;
  subtitle: string;
  roles: RoleDetail[];
  capacity: number;
  addRole: (values: RoleFormValues) => string | undefined;
  updateRole: (id: number, values: RoleFormValues) => string | undefined;
  /** Called when the user clicks delete on a role — parent decides whether to confirm. */
  onDeleteRole: (role: RoleDetail) => void;
}

export default function RoleManager({
  title,
  subtitle,
  roles,
  capacity,
  addRole,
  updateRole,
  onDeleteRole,
}: RoleManagerProps) {
  const atCapacity = roles.length >= capacity;
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDetail | undefined>(
    undefined,
  );

  function openCreateModal() {
    setEditingRole(undefined);
    setFormModalOpen(true);
  }

  function openEditModal(role: RoleDetail) {
    setEditingRole(role);
    setFormModalOpen(true);
  }

  function closeFormModal() {
    setFormModalOpen(false);
    setEditingRole(undefined);
  }

  function handleSubmit(values: RoleFormValues): string | undefined {
    const error = editingRole
      ? updateRole(editingRole.id, values)
      : addRole(values);
    if (error) return error;
    closeFormModal();
    return undefined;
  }

  return (
    <Can action={PERMISSIONS.ROLE_VIEW}>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
            <p className="mt-1 text-xs text-ink-faint">
              {roles.length} / {capacity} roles used
            </p>
          </div>

          <Can allOf={[PERMISSIONS.ROLE_VIEW, PERMISSIONS.ROLE_ADD]}>
            <Button
              variant="secondary"
              onClick={openCreateModal}
              disabled={atCapacity}
              title={
                atCapacity ? `Role limit reached (${capacity})` : undefined
              }
            >
              <Plus size={15} className="mr-1.5" />
              Add role
            </Button>
          </Can>
        </div>

        <RoleList
          roles={roles}
          onEdit={openEditModal}
          onDelete={onDeleteRole}
        />

        {formModalOpen && !atCapacity && (
          <Can anyOf={[PERMISSIONS.ROLE_ADD, PERMISSIONS.ROLE_UPDATE]}>
            <RoleFormModal
              open={formModalOpen}
              onClose={closeFormModal}
              onSubmit={handleSubmit}
              role={editingRole}
            />
          </Can>
        )}
      </div>
    </Can>
  );
}
