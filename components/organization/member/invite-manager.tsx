"use client";

import { useState } from "react";
import { EmailChipInput } from "@/components/organization/create/email-chip-input";
import { SetRoleModal } from "@/components/organization/role/set-role-modal";
import { CapacityHeader } from "@/components/ui/capacity-header";
import InviteList from "./invite-list";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface InviteManagerProps {
  title: string;
  subtitle: string;
  /** Renders below the title/subtitle — e.g. an inline success/error alert. */
  banner?: React.ReactNode;
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
  banner,
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
    // Only ever invoked as SetRoleModal's onConfirm, and that modal only
    // renders `open` (and thus clickable) once activeInviteId is set.
    onChangeRole(activeInviteId!, roleId);
    setActiveInviteId(null);
  }

  return (
    <Can action={PERMISSIONS.MEMBER_VIEW_MEMBERS}>
      <div className="space-y-5">
        <CapacityHeader
          title={title}
          subtitle={subtitle}
          used={totalInvites}
          capacity={capacity}
          unitLabel="invite"
        />

        {banner}

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
