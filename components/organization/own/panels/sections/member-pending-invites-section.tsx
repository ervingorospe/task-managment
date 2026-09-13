"use client";

import { useEffect, useState } from "react";
import PendingInviteList from "@/components/organization/member/pending-invite-list";
import Card from "@/components/ui/card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

const RESEND_COOLDOWN_SECONDS = 300;

interface InvitePeopleSectionProps {
  orgId: string | number;
  invites: MemberInviteDetail[] | undefined;
  roles: RoleDetail[];
}

export default function MemberPendingInvites({
  orgId,
  invites,
  roles,
}: InvitePeopleSectionProps) {
  const [pendingInvites, setPendingInvites] = useState<MemberInviteDetail[]>(
    invites ?? [],
  );
  const [resendCooldowns, setResendCooldowns] = useState<
    Record<string, number>
  >({});
  const [pendingRemoveInvite, setPendingRemoveInvite] =
    useState<MemberInviteDetail | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setResendCooldowns((current) => {
        const next = { ...current };
        for (const [inviteId, seconds] of Object.entries(next)) {
          if (seconds <= 1) {
            delete next[inviteId];
          } else {
            next[inviteId] = seconds - 1;
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  function handleRemoveInvite(id: number) {
    setPendingInvites((prev) => prev.filter((invite) => invite.id !== id));
    // TODO: await DELETE /organizations/:orgId/invites/:id
    console.log("Remove invite:", id);
  }

  function handleConfirmRemove() {
    if (!pendingRemoveInvite) return;
    handleRemoveInvite(pendingRemoveInvite.id);
    setPendingRemoveInvite(null);
  }

  async function handleResendInvite(id: number) {
    const cooldown = resendCooldowns[id];
    if (cooldown) return;

    // TODO: await POST /organizations/:orgId/invites/:id/resend
    console.log("Resend invite:", id);

    setResendCooldowns((current) => ({
      ...current,
      [id]: RESEND_COOLDOWN_SECONDS,
    }));
  }

  return (
    <>
      <Card
        title="Pending Invitations"
        subtitle="Invitations that have not been accepted yet."
      >
        {pendingInvites.length > 0 ? (
          <PendingInviteList
            invites={pendingInvites}
            roles={roles}
            resendCooldowns={resendCooldowns}
            onRemove={(invite) => setPendingRemoveInvite(invite)}
            onResend={handleResendInvite}
          />
        ) : (
          <div className="rounded border border-dashed border-line p-8 text-center">
            <p className="text-sm font-medium text-ink">
              No pending invitations
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Invitations you send will appear here until they are accepted.
            </p>
          </div>
        )}
      </Card>

      {pendingRemoveInvite && (
        <ConfirmDialog
          open={pendingRemoveInvite !== null}
          onClose={() => setPendingRemoveInvite(null)}
          onConfirm={handleConfirmRemove}
          title="Remove invitation?"
          confirmLabel="Remove invitation"
          description={`Are you sure you want to remove the invitation sent to ${pendingRemoveInvite.email}? They will no longer be able to use this invitation to join the organization.`}
          danger
        />
      )}
    </>
  );
}
