"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { MemberRemovedState } from "@/components/organization/member-removed-state";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import ProjectsPageClient from "@/components/organization/project/projects-page-client";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Loading from "./loading";

export default function ProjectsPage() {
  useDocumentTitle("Projects");
  const { slug } = useParams<{ slug: string }>();
  const { organization, loading } = useOrganizationBySlug(slug);
  const membership = useMembershipBySlug(slug);

  if (loading) return <Loading />;
  // See organizations/[slug]/tickets/page.tsx's identical check.
  if (membership && !membership.isActive) {
    return (
      <MemberRemovedState
        organizationName={membership.organization.organizationName}
      />
    );
  }
  if (!organization) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <Can
        anyOf={[
          PERMISSIONS.PROJECT_VIEW,
          PERMISSIONS.PROJECT_VIEW_OWN,
          PERMISSIONS.PROJECT_ADD,
          PERMISSIONS.PROJECT_UPDATE,
          PERMISSIONS.PROJECT_REMOVE,
        ]}
        fallback={
          <EmptyState subtitle="You do not have permission to view projects." />
        }
      >
        <ProjectsPageClient organization={organization} />
      </Can>
    </MemberGuard>
  );
}
