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
  capacity: number;
  totalInvites: number;
  onAdd: (emails: string[]) => void;
  onRemove: (id: number) => void;
  onChangeRole: (inviteId: number, roleId: number) => void;
}

export default function InviteManager({
  title,
  subtitle,
  invites,
  roles,
  capacity,
  totalInvites = 0,
  onAdd,
  onRemove,
  onChangeRole,
}: InviteManagerProps) {
  const atCapacity = totalInvites >= capacity;
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
          <p className="mt-1 text-xs text-ink-faint">
            {totalInvites} / {capacity} invite used
          </p>
        </div>

        <EmailChipInput
          onAdd={onAdd}
          atCapacity={atCapacity}
          capacity={capacity}
        />

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
          currentRoleId={activeInvite?.roleId ?? null}
          onConfirm={handleRoleConfirm}
        />
      </div>
    </Can>
  );
}
