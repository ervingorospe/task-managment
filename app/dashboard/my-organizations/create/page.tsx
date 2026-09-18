import {
  getDefaultRoles,
  getPermissionOptions,
  getDefaultTags,
  getOrgCapacity,
} from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import { CreateOrganizationClient } from "@/components/organization/create/create-organization-client";
import BackButton from "@/components/ui/buttons/button-back";
import { AccountTypeGuard } from "@/components/auth/account-type.guard";
import { ACCOUNT_TYPE } from "@/lib/constants/accoun-type.constant";

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
    <AccountTypeGuard accountType={ACCOUNT_TYPE.OWNER}>
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
    </AccountTypeGuard>
  );
}
