"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useOrgReferenceData } from "@/hooks/use-org-reference-data";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import OrganizationTabs from "@/components/organization/own/organization-tabs";
import BackButton from "@/components/ui/buttons/button-back";
import { OwnerGuard } from "@/components/auth/owner-guard";
import { OrganizationInfoSkeleton } from "@/components/ui/skeletons";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading: orgLoading } = useOrganizationBySlug(slug);
  useDocumentTitle(organization?.organizationName);
  const { permissionOptions, ruleCategories, loading: refsLoading } =
    useOrgReferenceData();

  if (orgLoading || refsLoading) {
    return <OrganizationInfoSkeleton />;
  }

  if (!organization) notFound();

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
