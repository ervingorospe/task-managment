"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import OrganizationMembers from "@/components/organization/own/panels/organization-members";
import Loading from "./loading";

export default function MembersPage() {
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading } = useOrganizationBySlug(slug);

  if (loading) return <Loading />;
  if (!organization) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
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
            <OrganizationMembers organization={organization} showInvites={false} />
          </div>
        </div>
      </Can>
    </MemberGuard>
  );
}
