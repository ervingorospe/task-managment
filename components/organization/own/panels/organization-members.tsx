"use client";

import { useMemo, useState } from "react";
import Container from "@/components/layout/container";
import MembersSection from "./sections/members-section";
import MemberInvitesSection from "./sections/member-invites-section";
import MemberPendingInvites from "./sections/member-pending-invites-section";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { MemberInviteDetail } from "@/lib/types/organization/member-invite-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface OrganizationMembersProps {
  organization: OrganizationDetail;
  /** Hides the invite-people/pending-invites sections — off by default, used
   * only by the standalone /organizations/:slug/members page, which shows
   * just the member list. */
  showInvites?: boolean;
}

export default function OrganizationMembers({
  organization,
  showInvites = true,
}: OrganizationMembersProps) {
  // Owned here rather than in either child, so a newly sent invite (or one
  // just removed) is reflected the instant the API call resolves —
  // MemberInvitesSection appends what the backend just created,
  // MemberPendingInvites removes what it deletes. Relying on a page
  // refetch to hand fresh props back down instead (e.g. router.refresh())
  // isn't reliable here: it races the GET's own short-lived fetch cache
  // and can leave this list stale well after the write has landed.
  const [pendingInvites, setPendingInvites] = useState<MemberInviteDetail[]>(
    organization.pendingInvites ?? [],
  );

  // The owner's own Member row (Superadmin, per how org creation works —
  // see permissions.constant.ts's header comment) doesn't belong in a
  // list of "members of this organization" — they're surfaced separately
  // via the org's own `owner` field. The viewer's own row, if they're a
  // regular member, DOES belong here — MemberListSection just disables
  // self-actions on it (see its own isSelf check).
  const visibleMembers = useMemo(
    () => organization.members.filter((m) => m.user?.id !== organization.ownerId),
    [organization.members, organization.ownerId],
  );

  return (
    <Container>
      {showInvites && (
        <>
          <Can action={PERMISSIONS.MEMBER_INVITE}>
            <MemberInvitesSection
              orgId={organization.id}
              roles={organization.roles}
              capacity={organization.capacity.members}
              currentTotalInvites={pendingInvites.length}
              onSent={(sent) =>
                setPendingInvites((prev) => [...prev, ...sent])
              }
            />
          </Can>

          <MemberPendingInvites
            orgId={organization.id}
            invites={pendingInvites}
            roles={organization.roles}
            onInvitesChange={setPendingInvites}
          />
        </>
      )}

      <Can
        anyOf={[
          PERMISSIONS.MEMBER_VIEW_MEMBERS,
          PERMISSIONS.MEMBER_UPDATE_ROLE,
          PERMISSIONS.MEMBER_REMOVE,
          PERMISSIONS.MEMBER_SET_ACTIVE,
        ]}
      >
        <MembersSection
          orgId={organization.id}
          roles={organization.roles}
          members={visibleMembers}
        />
      </Can>
    </Container>
  );
}
