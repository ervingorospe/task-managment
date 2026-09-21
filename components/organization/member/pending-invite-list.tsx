"use client";

import IconButton from "@/components/ui/buttons/button-icon";
import List from "@/components/ui/list";
import EmptyState from "@/components/ui/empty-state";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { RotateCcw, Trash2 } from "lucide-react";
import { getInviteExpiryState, formatInviteExpiry } from "@/lib/helper/invite-status";
import { InviteExpiryChip } from "./invite-expiry-chip";

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
      <EmptyState
        title="No pending invitations"
        subtitle="Invitations that have not been accepted will appear here."
      />
    );
  }

  return (
    <List>
      {invites.map((invite) => {
        const role = roles.find((item) => item.id === invite.roleId);
        const cooldown = resendCooldowns[invite.id] ?? 0;
        const expiryState = getInviteExpiryState(invite);
        const expiryText = formatInviteExpiry(invite);
        const isExpired = expiryState === "expired";
        const canResend = cooldown === 0 && !isExpired;

        return (
          <List.ListItem
            key={invite.id}
            title={invite.email}
            subtitle={
              <span className="flex items-center gap-1.5">
                {role?.roleName ?? "No role assigned"}
                {expiryText && (
                  <>
                    <span aria-hidden className="text-ink-faint">
                      ·
                    </span>
                    {expiryState ? (
                      <InviteExpiryChip state={expiryState} />
                    ) : (
                      <span>{expiryText}</span>
                    )}
                  </>
                )}
              </span>
            }
            trailing={
              <div className="flex items-center gap-2">
                {isExpired ? (
                  <span className="text-xs text-ink-faint">
                    Remove and re-invite instead
                  </span>
                ) : canResend ? (
                  <IconButton
                    icon={<RotateCcw size={15} />}
                    label="Resend invitation"
                    onClick={() => onResend(invite.id)}
                  />
                ) : (
                  <span className="text-xs text-ink-faint">
                    Resend in {cooldown}s
                  </span>
                )}

                <IconButton
                  icon={<Trash2 size={15} />}
                  label="Remove invitation"
                  onClick={() => onRemove(invite)}
                />
              </div>
            }
          />
        );
      })}
    </List>
  );
}
