import { notFound } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import { Can } from "@/components/auth/can";
import {
  REQUEST_ALL_PERMISSIONS,
  REQUEST_OWN_PERMISSIONS,
} from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import RequestsPageClient from "@/components/organization/requests/requests-page-client";

interface RequestsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RequestsPage({ params }: RequestsPageProps) {
  const { slug } = await params;
  const organization = await getOrganizationBySlug(slug);

  if (!organization) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <Can
        anyOf={[...REQUEST_ALL_PERMISSIONS, ...REQUEST_OWN_PERMISSIONS]}
        fallback={
          <EmptyState subtitle="You do not have permission to view requests." />
        }
      >
        <RequestsPageClient organization={organization} />
      </Can>
    </MemberGuard>
  );
}
