"use client";

import Container from "@/components/layout/container";
import MembersSection from "./sections/members-section";
import MemberInvitesSection from "./sections/member-invites-section";
import MemberPendingInvites from "./sections/member-pending-invites-section";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
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
  return (
    <Container>
      {showInvites && (
        <>
          <Can action={PERMISSIONS.MEMBER_INVITE}>
            <MemberInvitesSection
              orgId={organization.id}
              roles={organization.roles}
              capacity={organization.capacity.members}
              currentTotalInvites={organization.pendingInvites?.length ?? 0}
            />
          </Can>

          <MemberPendingInvites
            orgId={organization.id}
            invites={organization.pendingInvites}
            roles={organization.roles}
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
          members={organization.members}
        />
      </Can>
    </Container>
  );
}
