"use client";

import Container from "@/components/layout/container";
import MemberInvitesSection from "./sections/member-invites-section";
import MemberPendingInvites from "./sections/member-pending-invites-section";
import MembersSection from "./sections/members-section";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface OrganizationMembersProps {
  organization: OrganizationDetail;
}

export default function OrganizationMembers({
  organization,
}: OrganizationMembersProps) {
  const currentTotalInvites =
    (organization.pendingInvites?.length ?? 0) + organization.members.length;

  return (
    <Container>
      <Can action={PERMISSIONS.MEMBER_INVITE}>
        <MemberInvitesSection
          orgId={organization.id}
          roles={organization.roles}
          capacity={organization.capacity.members}
          currentTotalInvites={currentTotalInvites}
        />
      </Can>

      <Can action={PERMISSIONS.MEMBER_INVITE}>
        <MemberPendingInvites
          orgId={organization.id}
          roles={organization.roles}
          invites={organization.pendingInvites}
        />
      </Can>

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
