"use client";

import { useState } from "react";
import InviteManager from "@/components/organization/member/invite-manager";
import { Button } from "@/components/ui/buttons/button";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { shouldToastApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useAuth } from "@/providers/auth-provider";
import { inviteMember } from "@/lib/api/members";

interface InvitePeopleSectionProps {
  orgId: number;
  roles: RoleDetail[];
  capacity: number;
  currentTotalInvites: number;
  /** Called with the backend-created invite objects (real ids, not the
   * local temp ones) after a successful send, so the sibling
   * MemberPendingInvites list can show them immediately. */
  onSent: (invites: MemberInviteDetail[]) => void;
}

export default function MemberInvitesSection({
  orgId,
  roles,
  capacity,
  currentTotalInvites,
  onSent,
}: InvitePeopleSectionProps) {
  // This is a compose-and-queue box, not a persisted list — nothing here
  // hits the backend until "Send Invite," at which point onSent() hands
  // the created invites to the parent for MemberPendingInvites to render.
  const toast = useToast();
  const { currentUser } = useAuth();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logMemberActivity = useLogActivity("member");
  const atCapacity = currentTotalInvites >= capacity;
  const [invites, setInvites] = useState<MemberInviteDetail[]>([]);
  const [isSending, setIsSending] = useState(false);

  function handleAdd(emails: string[]) {
    const defaultRoleId =
      roles.find((r) => r.roleName === "Member")?.id ?? roles[0]?.id ?? 0;
    const existing = new Set(invites.map((i) => i.email.toLowerCase()));
    const newInvites: MemberInviteDetail[] = emails
      .filter((email) => !existing.has(email.toLowerCase()))
      .map((email, index) => ({
        id: Date.now() + index,
        email,
        roleId: defaultRoleId,
      }));

    if (newInvites.length === 0) return;
    setInvites((prev) => [...prev, ...newInvites]);
    for (const invite of newInvites) {
      logMemberActivity({
        orgId,
        action: "invited",
        entityId: invite.id,
        entityLabel: invite.email,
        description: `invited ${invite.email} to join the organization`,
      });
    }
  }

  function handleRemove(id: number) {
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  function handleChangeRole(inviteId: number, roleId: number) {
    setInvites((prev) =>
      prev.map((i) => (i.id === inviteId ? { ...i, roleId: roleId } : i)),
    );
  }

  // Actually persists the queued invites — this only saves the invite row
  // to the database (no email dispatch, no SES integration yet). Members
  // still find out about it some other way for now.
  // The "Send Invite" button is disabled whenever invites.length === 0.
  async function handleSendInvites() {
    setIsSending(true);

    const inviterName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : undefined;
    const results = await Promise.allSettled(
      invites.map((invite) =>
        inviteMember(orgId, {
          email: invite.email,
          roleId: invite.roleId,
          inviterName,
        }),
      ),
    );

    const sent: MemberInviteDetail[] = [];
    const failedEmails: string[] = [];
    // Real system faults (5xx, network failure, etc.) toast — those are
    // unexpected. A 409 means the request was fine but the email already
    // has a pending invite; that's an expected, local-to-this-form
    // outcome, so it gets the inline alert below instead.
    const systemFaultEmails: string[] = [];
    const conflictEmails: string[] = [];
    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        sent.push(result.value);
      } else {
        failedEmails.push(invites[i].email);
        if (shouldToastApiError(result.reason)) {
          systemFaultEmails.push(invites[i].email);
        } else {
          conflictEmails.push(invites[i].email);
        }
      }
    });

    setInvites((prev) => prev.filter((i) => failedEmails.includes(i.email)));
    setIsSending(false);

    if (sent.length > 0) {
      onSent(sent);
      // Logged with the real backend id sent returned (not the local
      // temp id) — that temp id is a Date.now() timestamp, which
      // overflows the activity log's int entityId column.
      for (const invite of sent) {
        logMemberActivity({
          orgId,
          action: "invited",
          entityId: invite.id,
          entityLabel: invite.email,
          description: `invited ${invite.email} to join the organization`,
        });
      }
    }

    // One alert, combining whatever actually happened — errors take the
    // variant when there's a conflict, even alongside a partial success,
    // since that's the part that needs the user's attention.
    const alertParts: string[] = [];
    if (sent.length > 0) {
      alertParts.push(sent.length === 1 ? "1 invite sent" : `${sent.length} invites sent`);
    }
    if (conflictEmails.length > 0) {
      alertParts.push(
        conflictEmails.length === 1
          ? `${conflictEmails[0]} already has a pending invitation.`
          : `These emails already have a pending invitation: ${conflictEmails.join(", ")}.`,
      );
    }
    if (alertParts.length > 0) {
      showAlert(alertParts.join(" "), conflictEmails.length > 0 ? "error" : "success");
    }

    if (systemFaultEmails.length > 0) {
      toast(
        `Failed to send ${systemFaultEmails.length === 1 ? "invite" : "invites"} for ${systemFaultEmails.join(", ")}`,
        "error",
      );
    }
  }

  return (
    <section className="rounded border border-line bg-surface p-6">
      <InviteManager
        title="Invite People"
        invites={invites}
        subtitle="Invite people to join your organization and assign them a role."
        banner={
          alert && (
            <InlineAlert
              message={alert.message}
              variant={alert.variant}
              onDismiss={dismissAlert}
            />
          )
        }
        roles={roles}
        capacity={capacity}
        totalInvites={currentTotalInvites + invites.length}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChangeRole={handleChangeRole}
      />

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <div className="flex w-full justify-end">
          <Button
            disabled={atCapacity || invites.length === 0 || isSending}
            onClick={handleSendInvites}
            title={
              atCapacity ? `Invite limit reached (${capacity})` : undefined
            }
          >
            {isSending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </div>
    </section>
  );
}
