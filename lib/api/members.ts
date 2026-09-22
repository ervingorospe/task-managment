import { api } from "./client";
import { adaptInvite } from "./adapters";
import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import type { RawMemberInvite } from "./raw-types";

export async function inviteMember(
  orgId: number,
  payload: { email: string; roleId: number; inviterName?: string },
): Promise<MemberInviteDetail> {
  const invite = await api.post<RawMemberInvite>(
    `/members/invite?orgId=${orgId}`,
    payload,
  );
  return adaptInvite(invite);
}

export async function resendInvite(inviteId: number): Promise<MemberInviteDetail> {
  const invite = await api.post<RawMemberInvite>(
    `/members/invites/${inviteId}/resend`,
  );
  return adaptInvite(invite);
}

export async function removeInvite(inviteId: number): Promise<void> {
  await api.delete(`/members/invites/${inviteId}`);
}

export async function updateMemberRole(
  memberId: number,
  roleId: number,
): Promise<void> {
  await api.patch(`/members/${memberId}/role`, { roleId });
}

export async function updateMemberActiveState(
  memberId: number,
  isActive: boolean,
): Promise<void> {
  await api.patch(`/members/${memberId}/active-state`, { isActive });
}

export async function removeMember(memberId: number): Promise<void> {
  await api.delete(`/members/${memberId}`);
}
