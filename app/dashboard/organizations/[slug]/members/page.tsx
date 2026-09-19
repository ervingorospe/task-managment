import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import OrganizationMembers from "@/components/organization/own/panels/organization-members";

interface MembersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) notFound();

  return (
    <MemberGuard organizationId={organization.id}>
      <Can
        action={PERMISSIONS.MEMBER_VIEW_MEMBERS}
        fallback={
          <EmptyState subtitle="You do not have permission to view organization members." />
        }
      >
        <div>
          <div>
            <h1 className="text-lg font-semibold text-ink">Members</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Everyone in {organization.organizationName}.
            </p>
          </div>

          <div className="mt-6">
            <OrganizationMembers organization={organization} />
          </div>
        </div>
      </Can>
    </MemberGuard>
  );
}
