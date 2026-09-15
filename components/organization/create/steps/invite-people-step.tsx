"use client";

import { useCallback } from "react";
import { useStepForm } from "@/hooks/use-step-form";
import { useStepper } from "@/providers/stepper.provider";
import InviteManager from "@/components/organization/member/invite-manager";
import { invitesSchema } from "@/lib/schemas/organization.schema";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";

const EMPTY_INVITES: MemberInviteDetail[] = [];

export default function InvitePeopleStep() {
  const { roles: defaultRoles, capacity } = useOrganizationDefaults();

  const { watch, setValue } = useStepForm(invitesSchema, {
    invites: EMPTY_INVITES,
  });

  const { formData } = useStepper();

  const invites =
    (watch("invites") as MemberInviteDetail[] | undefined) ?? EMPTY_INVITES;

  const roles = (formData.roles as RoleDetail[] | undefined) ?? defaultRoles;

  const addInvites = useCallback(
    (emails: string[]) => {
      const existing = new Set(
        invites.map((invite) => invite.email.toLowerCase()),
      );

      const newInvites: MemberInviteDetail[] = emails
        .filter((email) => !existing.has(email.toLowerCase()))
        .map((email) => ({
          id: Date.now(),
          email,
          roleId: 3,
        }));

      if (newInvites.length === 0) return;

      setValue("invites", [...invites, ...newInvites], {
        shouldValidate: true,
        shouldDirty: true,
      });
    },
    [invites, setValue],
  );

  const removeInvite = useCallback(
    (id: number) => {
      setValue(
        "invites",
        invites.filter((invite) => invite.id !== id),
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );
    },
    [invites, setValue],
  );

  const changeInviteRole = useCallback(
    (inviteId: number, roleId: number) => {
      setValue(
        "invites",
        invites.map((invite) =>
          invite.id === inviteId ? { ...invite, roleId: roleId } : invite,
        ),
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );
    },
    [invites, setValue],
  );

  return (
    <InviteManager
      title="Invite People"
      subtitle="Invite your team members to join the organization."
      invites={invites}
      roles={roles}
      capacity={capacity.members}
      totalInvites={0}
      onAdd={addInvites}
      onRemove={removeInvite}
      onChangeRole={changeInviteRole}
    />
  );
}
