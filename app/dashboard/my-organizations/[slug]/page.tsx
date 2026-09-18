import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import {
  getPermissionOptions,
  getRuleCategories,
} from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import OrganizationTabs from "@/components/organization/own/organization-tabs"; // adjust to your actual component name
import BackButton from "@/components/ui/buttons/button-back";
import { OwnerGuard } from "@/components/auth/owner-guard";

interface OrganizationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;

  const [organization, permissionOptions, ruleCategories] = await Promise.all([
    getOrganizationBySlug(slug),
    getPermissionOptions(),
    getRuleCategories(),
  ]);

  if (!organization) {
    notFound();
  }

  return (
    <OwnerGuard ownerId={organization.ownerId}>
      <OrganizationDefaultsProvider
        roles={organization.roles}
        permissionOptions={permissionOptions}
        ruleCategories={ruleCategories}
        tags={organization.tags}
        capacity={organization.capacity}
      >
        <BackButton />
        <OrganizationTabs organization={organization} />
      </OrganizationDefaultsProvider>
    </OwnerGuard>
  );
}
