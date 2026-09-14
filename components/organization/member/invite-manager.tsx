"use client";

import { useState } from "react";
import { EmailChipInput } from "@/components/organization/create/email-chip-input";
import { SetRoleModal } from "@/components/organization/role/set-role-modal";
import InviteList from "./invite-list";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface InviteManagerProps {
  title: string;
  subtitle: string;
  invites: MemberInviteDetail[];
  roles: RoleDetail[];
  onAdd: (emails: string[]) => void;
  onRemove: (id: number) => void;
  onChangeRole: (inviteId: number, roleId: number) => void;
}

export default function InviteManager({
  title,
  subtitle,
  invites,
  roles,
  onAdd,
  onRemove,
  onChangeRole,
}: InviteManagerProps) {
  const [activeInviteId, setActiveInviteId] = useState<number | null>(null);

  const activeInvite =
    invites.find((invite) => invite.id === activeInviteId) ?? null;

  function handleRoleConfirm(roleId: number) {
    if (!activeInviteId) return;

    onChangeRole(activeInviteId, roleId);
    setActiveInviteId(null);
  }

  return (
    <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>

          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        </div>

        <EmailChipInput onAdd={onAdd} />

        {invites.length > 0 && (
          <InviteList
            invites={invites}
            roles={roles}
            onRemove={onRemove}
            onChangeRole={setActiveInviteId}
          />
        )}

        <SetRoleModal
          open={activeInviteId !== null}
          onClose={() => setActiveInviteId(null)}
          roles={roles}
          currentRoleId={activeInvite?.role_id ?? null}
          onConfirm={handleRoleConfirm}
        />
      </div>
    </Can>
  );
}
