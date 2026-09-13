"use client";

import List from "@/components/ui/list";
import RoleListItem from "@/components/organization/role/role-list-item";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";

interface RoleListProps {
  roles: RoleDetail[];
  onEdit: (role: RoleDetail) => void;
  onDelete: (role: RoleDetail) => void;
}

export default function RoleList({ roles, onEdit, onDelete }: RoleListProps) {
  return (
    <List>
      {roles.map((role) => (
        <RoleListItem
          key={role.id}
          role={role}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </List>
  );
}
