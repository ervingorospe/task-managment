import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import BasicInformation from "@/components/organization/own/panels/sections/basic-info-section";
import RolesSection from "@/components/organization/own/panels/sections/roles-section";
import TagsSection from "@/components/organization/own/panels/sections/tags-section";
import Container from "@/components/layout/container";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface OrganizationInformationProps {
  organization: OrganizationDetail;
}

export default function OrganizationInformation({
  organization,
}: OrganizationInformationProps) {
  return (
    <Container>
      <BasicInformation organization={organization} />
      <Can
        anyOf={[
          PERMISSIONS.ROLE_ADD,
          PERMISSIONS.ROLE_VIEW,
          PERMISSIONS.ROLE_UPDATE,
          PERMISSIONS.ROLE_REMOVE,
        ]}
      >
        <RolesSection
          roles={organization.roles}
          capacity={organization.capacity.roles}
          orgId={organization.id}
        />
      </Can>
      <Can
        anyOf={[
          PERMISSIONS.TAG_ADD,
          PERMISSIONS.TAG_REMOVE,
          PERMISSIONS.TAG_UPDATE,
          PERMISSIONS.TAG_VIEW,
        ]}
      >
        <TagsSection
          tags={organization.tags}
          capacity={organization.capacity.tags}
          orgId={organization.id}
        />
      </Can>
    </Container>
  );
}
