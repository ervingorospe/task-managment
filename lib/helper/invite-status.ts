import type { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";

export type InviteExpiryState = "expired" | "expiring-soon" | null;

const SOON_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/** Computed from the timestamp itself (not the `status` field the backend
 * last sent) so a tab left open past the expiry still reflects it, rather
 * than waiting for a refetch. */
export function getInviteExpiryState(
  invite: Pick<MemberInviteDetail, "expiry">,
): InviteExpiryState {
  if (!invite.expiry) return null;
  const msLeft = new Date(invite.expiry).getTime() - Date.now();
  if (msLeft <= 0) return "expired";
  if (msLeft <= SOON_THRESHOLD_MS) return "expiring-soon";
  return null;
}

export function formatInviteExpiry(
  invite: Pick<MemberInviteDetail, "expiry">,
): string | null {
  if (!invite.expiry) return null;
  const msLeft = new Date(invite.expiry).getTime() - Date.now();
  if (msLeft <= 0) return "Expired";

  const minutes = Math.round(msLeft / (60 * 1000));
  if (minutes < 60) return `Expires in ${minutes}m`;

  const hours = Math.round(msLeft / (60 * 60 * 1000));
  if (hours < 24) return `Expires in ${hours}h`;

  const days = Math.round(msLeft / (24 * 60 * 60 * 1000));
  return `Expires in ${days}d`;
}
