"use client";

import { useEffect, useMemo, useState } from "react";
import PendingInviteList from "@/components/organization/member/pending-invite-list";
import Card from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";

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
  const toast = useToast();
  const logMemberActivity = useLogActivity("member");
  const [pendingInvites, setPendingInvites] = useState<MemberInviteDetail[]>(
    invites ?? [],
  );
  const [resendCooldowns, setResendCooldowns] = useState<
    Record<string, number>
  >({});
  const [pendingRemoveInvite, setPendingRemoveInvite] =
    useState<MemberInviteDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.max(Math.ceil(pendingInvites.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedInvites = useMemo(
    () =>
      pendingInvites.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
    [pendingInvites, currentPage, pageSize],
  );

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
  }

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
    const invite = pendingInvites.find((i) => i.id === id);
    setPendingInvites((prev) => prev.filter((invite) => invite.id !== id));
    // TODO: await DELETE /organizations/:orgId/invites/:id
    console.log("Remove invite:", id);
    if (invite) {
      logMemberActivity({
        orgId: Number(orgId),
        action: "invite_removed",
        entityId: invite.id,
        entityLabel: invite.email,
        description: `removed the invitation sent to ${invite.email}`,
      });
    }
    toast("Invitation removed", "error");
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

    const invite = pendingInvites.find((i) => i.id === id);
    if (invite) {
      logMemberActivity({
        orgId: Number(orgId),
        action: "invite_resent",
        entityId: invite.id,
        entityLabel: invite.email,
        description: `resent the invitation to ${invite.email}`,
      });
    }
    toast("Invitation resent");
  }

  return (
    <Can action={PERMISSIONS.MEMBER_INVITE}>
      <Card
        title="Pending Invitations"
        subtitle="Invitations that have not been accepted yet."
        desc={`${pendingInvites.length} invited`}
      >
        <PendingInviteList
          invites={paginatedInvites}
          roles={roles}
          resendCooldowns={resendCooldowns}
          onRemove={(invite) => setPendingRemoveInvite(invite)}
          onResend={handleResendInvite}
        />

        {pendingInvites.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={pendingInvites.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
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
    </Can>
  );
}
