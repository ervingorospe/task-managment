"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import PendingInviteList from "@/components/organization/member/pending-invite-list";
import Card from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { resendInvite, removeInvite } from "@/lib/api/members";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

const RESEND_COOLDOWN_SECONDS = 300;

interface InvitePeopleSectionProps {
  orgId: string | number;
  invites: MemberInviteDetail[];
  roles: RoleDetail[];
  /** The parent (OrganizationMembers) owns this list — shared with the
   * sibling MemberInvitesSection, which appends to it on a successful
   * send — so removal here mutates it directly rather than keeping a
   * separate local copy that could drift out of sync. */
  onInvitesChange: Dispatch<SetStateAction<MemberInviteDetail[]>>;
}

export default function MemberPendingInvites({
  orgId,
  invites,
  roles,
  onInvitesChange,
}: InvitePeopleSectionProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logMemberActivity = useLogActivity("member");
  const [resendCooldowns, setResendCooldowns] = useState<
    Record<string, number>
  >({});
  const [pendingRemoveInvite, setPendingRemoveInvite] =
    useState<MemberInviteDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const totalPages = Math.max(Math.ceil(invites.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedInvites = useMemo(
    () => invites.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [invites, currentPage, pageSize],
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
    const invite = invites.find((i) => i.id === id);
    onInvitesChange((prev) => prev.filter((i) => i.id !== id));

    removeInvite(id).catch((error) => {
      if (invite) onInvitesChange((prev) => [...prev, invite]);
      notifyApiError(toast, error, "Failed to remove invitation");
    });

    if (invite) {
      logMemberActivity({
        orgId: Number(orgId),
        action: "invite_removed",
        entityId: invite.id,
        entityLabel: invite.email,
        description: `removed the invitation sent to ${invite.email}`,
      });
    }
    showAlert("Invitation removed", "error");
  }

  function handleConfirmRemove() {
    if (!pendingRemoveInvite) return;
    handleRemoveInvite(pendingRemoveInvite.id);
    setPendingRemoveInvite(null);
  }

  async function handleResendInvite(id: number) {
    const cooldown = resendCooldowns[id];
    if (cooldown) return;

    try {
      await resendInvite(id);
    } catch (error) {
      notifyApiError(toast, error, "Failed to resend invitation — try again in a moment");
      return;
    }

    setResendCooldowns((current) => ({
      ...current,
      [id]: RESEND_COOLDOWN_SECONDS,
    }));

    const invite = invites.find((i) => i.id === id);
    if (invite) {
      logMemberActivity({
        orgId: Number(orgId),
        action: "invite_resent",
        entityId: invite.id,
        entityLabel: invite.email,
        description: `resent the invitation to ${invite.email}`,
      });
    }
    showAlert("Invitation resent");
  }

  return (
    <Can action={PERMISSIONS.MEMBER_INVITE}>
      <Card
        title="Pending Invitations"
        subtitle="Invitations that have not been accepted yet."
        desc={`${invites.length} invited`}
        banner={
          alert && (
            <InlineAlert
              message={alert.message}
              variant={alert.variant}
              onDismiss={dismissAlert}
            />
          )
        }
      >
        <PendingInviteList
          invites={paginatedInvites}
          roles={roles}
          resendCooldowns={resendCooldowns}
          onRemove={(invite) => setPendingRemoveInvite(invite)}
          onResend={handleResendInvite}
        />

        {invites.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={invites.length}
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
