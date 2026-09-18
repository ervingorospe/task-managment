"use client";

import { memo } from "react";
import { Shuffle, Trash2 } from "lucide-react";
import List from "@/components/ui/list";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { IconButton } from "@/components/ui/buttons";

interface InviteListItemProps {
  invite: MemberInviteDetail;
  role?: RoleDetail;
  onRemove: (id: number) => void;
  onChangeRole: (id: number) => void;
}

function InviteListItem({
  invite,
  role,
  onRemove,
  onChangeRole,
}: InviteListItemProps) {
  return (
    <List.ListItem
      title={invite.email}
      subtitle={role?.roleDesc ?? "No role set"}
      trailing={
        <div className="flex items-center gap-2">
          <Can
            anyOf={[PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_UPDATE_ROLE]}
          >
            <button
              type="button"
              onClick={() => onChangeRole(invite.id)}
              className="flex items-center gap-1 rounded border border-line px-2 py-1 text-xs text-ink-muted hover:bg-canvas hover:text-ink"
            >
              <Shuffle size={12} />
              {role?.roleName ?? "No role"}
            </button>
          </Can>

          <Can action={PERMISSIONS.MEMBER_REMOVE}>
            <IconButton
              label={`Remove ${invite.email}`}
              icon={<Trash2 size={15} />}
              onClick={() => onRemove(invite.id)}
            />
          </Can>
        </div>
      }
    />
  );
}

export default memo(InviteListItem);
