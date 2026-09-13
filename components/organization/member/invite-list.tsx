"use client";

import List from "@/components/ui/list";
import InviteListItem from "./invite-list-item";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";

interface InviteListProps {
  invites: MemberInviteDetail[];
  roles: RoleDetail[];
  onRemove: (id: number) => void;
  onChangeRole: (id: number) => void;
}

export default function InviteList({
  invites,
  roles,
  onRemove,
  onChangeRole,
}: InviteListProps) {
  return (
    <List>
      {invites.map((invite) => {
        const role = roles.find((role) => role.id === invite.role_id);

        return (
          <InviteListItem
            key={invite.id}
            invite={invite}
            role={role}
            onRemove={onRemove}
            onChangeRole={onChangeRole}
          />
        );
      })}
    </List>
  );
}
