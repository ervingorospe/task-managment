"use client";

import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import List from "@/components/ui/list";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { IconButton } from "@/components/ui/buttons";

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
          {role.roleName}
          {role.isDefault && (
            <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
              Default
            </span>
          )}
        </span>
      }
      subtitle={role.roleDesc}
      trailing={
        canEdit || canDelete ? (
          <div className="flex items-center gap-1">
            {canEdit && (
              <Can allOf={[PERMISSIONS.ROLE_UPDATE, PERMISSIONS.ROLE_VIEW]}>
                <IconButton
                  label={`Edit ${role.roleName} role`}
                  icon={<Pencil size={15} />}
                  onClick={() => onEdit(role)}
                />
              </Can>
            )}
            {canDelete && (
              <Can allOf={[PERMISSIONS.ROLE_REMOVE, PERMISSIONS.ROLE_VIEW]}>
                <IconButton
                  label={`Delete ${role.roleName} role`}
                  icon={<Trash2 size={15} />}
                  onClick={() => onDelete(role)}
                />
              </Can>
            )}
          </div>
        ) : null
      }
    />
  );
}

export default memo(RoleListItem);
