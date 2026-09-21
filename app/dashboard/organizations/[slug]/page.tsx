import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import { getPermissionOptions, getRuleCategories } from "@/lib/data/organizations";
import { OrganizationDefaultsProvider } from "@/providers/organization-defaults.provider";
import MemberGuard from "@/components/auth/member-guard";
import OrganizationMemberTabs from "@/components/organization/member/organization-member-tab";
import BackButton from "@/components/ui/buttons/button-back";

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

  if (!organization) notFound();

  return (
    <MemberGuard organizationId={organization.id}>
      {/* No isActive prop here, unlike the other /organizations/[slug]/**
          pages — this is the org's own Info tab, where a member needs to
          stay able to leave even after the org's been disabled.
          OrganizationMemberTabs handles showing OrganizationDisabledState
          for its other tabs itself, alongside the leave action. */}
      {/* The Info tab's RolesSection/TagsSection are shared with the
          owner-only /dashboard/my-organizations/[slug] page, which is why
          this route needs the same OrganizationDefaultsProvider — without
          it, RolesSection's useOrganizationDefaults() throws for any
          member with role-viewing permission (see role-form-modal.tsx and
          roles-section.tsx). */}
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
