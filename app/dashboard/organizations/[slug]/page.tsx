import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import OrganizationMemberTabs from "@/components/organization/member/organization-member-tab";
import BackButton from "@/components/ui/back-button";

interface OrganizationPageProps {
  params: Promise<{ slug: string }>;
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) notFound();

  return (
    <MemberGuard organizationId={organization.id}>
      <BackButton />
      <OrganizationMemberTabs organization={organization} />
    </MemberGuard>
  );
}
