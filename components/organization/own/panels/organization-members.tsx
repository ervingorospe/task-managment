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
  return (
    <Container>
      <MemberInvitesSection
        orgId={organization.id}
        roles={organization.roles}
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
