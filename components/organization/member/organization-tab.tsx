"use client";

import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import OrganizationInformation from "@/components/organization/own/panels/organization-information";

export default function OrganizaionTab({
  organization,
}: {
  organization: OrganizationDetail;
}) {
  return <OrganizationInformation organization={organization} />;
}
