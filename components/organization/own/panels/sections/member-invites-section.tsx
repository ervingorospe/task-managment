"use client";

import { useState } from "react";
import InviteManager from "@/components/organization/member/invite-manager";
import { Button } from "@/components/ui/Button";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";

interface InvitePeopleSectionProps {
  orgId: number;
  roles: RoleDetail[];
}

export default function MemberInvitesSection({
  orgId,
  roles,
}: InvitePeopleSectionProps) {
  // This is a compose-and-send box, not a persisted list — invites sent
  // here move into MemberPendingInvites once "sent." For the mock phase,
  // this local list just represents "invites queued in this session."
  const [invites, setInvites] = useState<MemberInviteDetail[]>([]);

  function handleAdd(emails: string[]) {
    const existing = new Set(invites.map((i) => i.email.toLowerCase()));
    const newInvites: MemberInviteDetail[] = emails
      .filter((email) => !existing.has(email.toLowerCase()))
      .map((email) => ({ id: Date.now(), email, role_id: 3 }));

    if (newInvites.length === 0) return;
    setInvites((prev) => [...prev, ...newInvites]);
    // TODO: POST /organizations/:orgId/invites in the background.
  }

  function handleRemove(id: number) {
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  function handleChangeRole(inviteId: number, roleId: number) {
    setInvites((prev) =>
      prev.map((i) => (i.id === inviteId ? { ...i, role_id: roleId } : i)),
    );
  }

  return (
    <section className="rounded border border-line bg-surface p-6">
      <InviteManager
        title="Invite People"
        invites={invites}
        subtitle="Invite people to join your organization and assign them a role."
        roles={roles}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onChangeRole={handleChangeRole}
      />

      <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
        <div className="flex w-full justify-end">
          <Button>Send Invite</Button>
        </div>
      </div>
    </section>
  );
}
