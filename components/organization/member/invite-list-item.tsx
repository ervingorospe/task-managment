"use client";

import { memo } from "react";
import { Shuffle, Trash2 } from "lucide-react";
import List from "@/components/ui/list";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

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
      subtitle={role?.role_desc ?? "No role set"}
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
              {role?.role_name ?? "No role"}
            </button>
          </Can>

          <Can action={PERMISSIONS.MEMBER_REMOVE}>
            <button
              type="button"
              onClick={() => onRemove(invite.id)}
              className="rounded p-1.5 text-ink-faint transition-colors hover:bg-danger-subtle hover:text-danger"
              aria-label={`Remove ${invite.email}`}
            >
              <Trash2 size={15} />
            </button>
          </Can>
        </div>
      }
    />
  );
}

export default memo(InviteListItem);
