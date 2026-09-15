"use client";

import Container from "@/components/layout/container";
import MemberInvitesSection from "./sections/member-invites-section";
import MemberPendingInvites from "./sections/member-pending-invites-section";
import MembersSection from "./sections/members-section";
import { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

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
      <MemberInvitesSection
        orgId={organization.id}
        roles={organization.roles}
        capacity={organization.capacity.members}
        currentTotalInvites={currentTotalInvites}
      />

      <MemberPendingInvites
        orgId={organization.id}
        roles={organization.roles}
        invites={organization.pendingInvites}
      />

      <MembersSection
        orgId={organization.id}
        roles={organization.roles}
        members={organization.members}
      />
    </Container>
  );
}
