import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import BasicInformation from "@/components/organization/own/panels/sections/basic-info-section";
import RolesSection from "@/components/organization/own/panels/sections/roles-section";
import TagsSection from "@/components/organization/own/panels/sections/tags-section";
import Container from "@/components/layout/container";

interface OrganizationInformationProps {
  organization: OrganizationDetail;
}

export default function OrganizationInformation({
  organization,
}: OrganizationInformationProps) {
  return (
    <Container>
      <BasicInformation organization={organization} />
      <RolesSection
        roles={organization.roles}
        capacity={organization.capacity.roles}
        orgId={organization.id}
      />
      <TagsSection
        tags={organization.tags}
        capacity={organization.capacity.tags}
        orgId={organization.id}
      />
    </Container>
  );
}
