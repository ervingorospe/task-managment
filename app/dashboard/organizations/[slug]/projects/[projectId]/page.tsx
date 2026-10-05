"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import { useMembershipBySlug } from "@/hooks/use-membership-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { MemberRemovedState } from "@/components/organization/member-removed-state";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import ProjectDetailPageClient from "@/components/organization/project/project-detail-page-client";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Loading from "./loading";

export default function ProjectDetailPage() {
  const { slug, projectId } = useParams<{
    slug: string;
    projectId: string;
  }>();
  const { organization, loading } = useOrganizationBySlug(slug);
  const membership = useMembershipBySlug(slug);
  useDocumentTitle(
    organization?.projects.find((p) => p.id === Number(projectId))?.name,
  );

  if (loading) return <Loading />;
  // See organizations/[slug]/tickets/page.tsx's identical check.
  if (membership && !membership.isActive) {
    return (
      <MemberRemovedState organizationName={membership.organization.organizationName} />
    );
  }
  if (!organization) notFound();

  const project = organization.projects.find(
    (p) => p.id === Number(projectId),
  );
  if (!project) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <Can
        anyOf={[PERMISSIONS.PROJECT_VIEW, PERMISSIONS.PROJECT_VIEW_OWN]}
        fallback={
          <EmptyState subtitle="You do not have permission to view this project." />
        }
      >
        <ProjectDetailPageClient organization={organization} project={project} />
      </Can>
    </MemberGuard>
  );
}
