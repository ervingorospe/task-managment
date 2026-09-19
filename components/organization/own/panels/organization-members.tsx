"use client";

import Container from "@/components/layout/container";
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
  return (
    <Container>
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
