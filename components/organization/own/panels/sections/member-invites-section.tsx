"use client";

import { useState } from "react";
import InviteManager from "@/components/organization/member/invite-manager";
import { Button } from "@/components/ui/buttons/button";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { useToast } from "@/providers/toast-provider";

interface InvitePeopleSectionProps {
  orgId: number;
  roles: RoleDetail[];
  capacity: number;
  currentTotalInvites: number;
}

export default function MemberInvitesSection({
  orgId,
  roles,
  capacity,
  currentTotalInvites,
}: InvitePeopleSectionProps) {
  // This is a compose-and-send box, not a persisted list — invites sent
  // here move into MemberPendingInvites once "sent." For the mock phase,
  // this local list just represents "invites queued in this session."
  const toast = useToast();
  const atCapacity = currentTotalInvites >= capacity;
  const [invites, setInvites] = useState<MemberInviteDetail[]>([]);

  function handleAdd(emails: string[]) {
    const existing = new Set(invites.map((i) => i.email.toLowerCase()));
    const newInvites: MemberInviteDetail[] = emails
      .filter((email) => !existing.has(email.toLowerCase()))
      .map((email) => ({ id: Date.now(), email, roleId: 3 }));

    if (newInvites.length === 0) return;
    setInvites((prev) => [...prev, ...newInvites]);
    toast(
      newInvites.length === 1
        ? `Invite queued for ${newInvites[0].email}`
        : `${newInvites.length} invites queued`,
    );
    // TODO: POST /organizations/:orgId/invites in the background.
  }

  function handleRemove(id: number) {
    setInvites((prev) => prev.filter((i) => i.id !== id));
    toast("Invite removed", "error");
  }

  function handleChangeRole(inviteId: number, roleId: number) {
    setInvites((prev) =>
      prev.map((i) => (i.id === inviteId ? { ...i, roleId: roleId } : i)),
    );
  }

  return (
    <section className="rounded border border-line bg-surface p-6">
      <InviteManager
        title="Invite People"
        invites={invites}
        subtitle="Invite people to join your organization and assign them a role."
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
            disabled={atCapacity}
            title={
              atCapacity ? `Invite limit reached (${capacity})` : undefined
            }
          >
            Send Invite
          </Button>
        </div>
      </div>
    </section>
  );
}
