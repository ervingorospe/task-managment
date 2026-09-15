"use client";

import List from "@/components/ui/list";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { RotateCcw, Trash2 } from "lucide-react";

interface PendingInviteListProps {
  invites: MemberInviteDetail[];
  roles: RoleDetail[];
  resendCooldowns: Record<string, number>;
  onRemove: (invite: MemberInviteDetail) => void;
  onResend: (id: number) => void;
}

export default function PendingInviteList({
  invites,
  roles,
  resendCooldowns,
  onRemove,
  onResend,
}: PendingInviteListProps) {
  if (invites.length === 0) {
    return (
      <div className="rounded border border-dashed border-line px-6 py-8 text-center">
        <p className="text-sm font-medium text-ink">No pending invitations</p>

        <p className="mt-1 text-sm text-ink-muted">
          Invitations that have not been accepted will appear here.
        </p>
      </div>
    );
  }

  return (
    <List>
      {invites.map((invite) => {
        const role = roles.find((item) => item.id === invite.roleId);
        const cooldown = resendCooldowns[invite.id] ?? 0;
        const canResend = cooldown === 0;

        return (
          <List.ListItem
            key={invite.id}
            title={invite.email}
            subtitle={role?.roleName ?? "No role assigned"}
            trailing={
              <div className="flex items-center gap-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => onResend(invite.id)}
                    className="rounded p-1.5 text-ink-faint hover:bg-canvas hover:text-ink"
                    aria-label={`Resend invitation to ${invite.email}`}
                  >
                    <RotateCcw size={15} />
                  </button>
                ) : (
                  <span className="text-xs text-ink-faint">
                    Resend in {cooldown}s
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemove(invite)}
                  className="rounded p-1.5 text-ink-faint hover:bg-danger-subtle hover:text-danger"
                  aria-label={`Cancel invitation to ${invite.email}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            }
          />
        );
      })}
    </List>
  );
}
