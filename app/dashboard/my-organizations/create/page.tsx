import {
  getDefaultRoles,
  getPermissionOptions,
  getDefaultTags,
  getOrgCapacity,
} from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import { CreateOrganizationClient } from "@/components/organization/create/create-organization-client";
import BackButton from "@/components/ui/buttons/button-back";

// Server Component — fetches once, before anything reaches the browser.
// No "use client" here; the interactive stepper lives one level down.
export default async function CreateOrganizationPage() {
  const [
    defaultRoles,
    permissionOptions,
    defaultTags,
    ruleCategories,
    capacity,
  ] = await Promise.all([
    getDefaultRoles(),
    getPermissionOptions(),
    getDefaultTags(),
    getPermissionOptions(),
    getOrgCapacity(),
  ]);

  return (
    <OrganizationDefaultsProvider
      roles={defaultRoles}
      permissionOptions={permissionOptions}
      tags={defaultTags}
      ruleCategories={ruleCategories}
      capacity={capacity}
    >
      <BackButton />
      <CreateOrganizationClient />
    </OrganizationDefaultsProvider>
  );
}
