"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import { useOrgReferenceData } from "@/hooks/use-org-reference-data";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import MemberGuard from "@/components/auth/member-guard";
import { MemberRemovedState } from "@/components/organization/member-removed-state";
import OrganizationMemberTabs from "@/components/organization/member/organization-member-tab";
import BackButton from "@/components/ui/buttons/button-back";
import { OrganizationInfoSkeleton } from "@/components/ui/skeletons";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function OrganizationPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading: orgLoading } = useOrganizationBySlug(slug);
  useDocumentTitle(organization?.organizationName);
  const { permissionOptions, ruleCategories, loading: refsLoading } =
    useOrgReferenceData();
  const membership = useMembershipBySlug(slug);

  if (orgLoading || refsLoading) {
    return <OrganizationInfoSkeleton />;
  }

  // See organizations/[slug]/tickets/page.tsx's identical check.
  if (membership && !membership.isActive) {
    return (
      <MemberRemovedState organizationName={membership.organization.organizationName} />
    );
  }
  if (!organization) notFound();

  return (
    <MemberGuard organizationId={organization.id}>
      <OrganizationDefaultsProvider
        roles={organization.roles}
        permissionOptions={permissionOptions}
        ruleCategories={ruleCategories}
        tags={organization.tags}
        capacity={organization.capacity}
      >
        <BackButton />
        <OrganizationMemberTabs organization={organization} />
      </OrganizationDefaultsProvider>
    </MemberGuard>
  );
}
