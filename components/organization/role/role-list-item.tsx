"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import List from "@/components/ui/list";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";

interface RoleListItemProps {
  role: RoleDetail;
  onEdit: (role: RoleDetail) => void;
  onDelete: (role: RoleDetail) => void;
}

function RoleListItem({ role, onEdit, onDelete }: RoleListItemProps) {
  const canEdit = !role.isLocked;
  const canDelete = !role.isDefault && !role.isLocked;

  return (
    <List.ListItem
      title={
        <span className="flex items-center gap-2">
          {role.role_name}
          {role.isDefault && (
            <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
              Default
            </span>
          )}
        </span>
      }
      subtitle={role.role_desc}
      trailing={
        canEdit || canDelete ? (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Can allOf={[PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_VIEW]}>
                <button
                  type="button"
                  onClick={() => onEdit(role)}
                  className="rounded p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-ink"
                  aria-label={`Edit ${role.role_name} role`}
                >
                  <Pencil size={15} />
                </button>
              </Can>
            )}
            {canDelete && (
              <Can allOf={[PERMISSIONS.ROLE_REMOVE, PERMISSIONS.ROLE_VIEW]}>
                <button
                  type="button"
                  onClick={() => onDelete(role)}
                  className="shrink-0 rounded p-1.5 text-ink-faint transition-colors hover:bg-danger-subtle hover:text-danger"
                  aria-label={`Delete ${role.role_name} role`}
                >
                  <Trash2 size={15} />
                </button>
              </Can>
            )}
          </div>
        ) : null
      }
    />
  );
}

export default memo(RoleListItem);
