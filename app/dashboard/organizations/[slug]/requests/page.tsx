"use client";

import { useParams, notFound } from "next/navigation";
import { useOrganizationBySlug } from "@/hooks/use-organization-by-slug";
import MemberGuard from "@/components/auth/member-guard";
import { Can } from "@/components/auth/can";
import {
  REQUEST_ALL_PERMISSIONS,
  REQUEST_OWN_PERMISSIONS,
} from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import RequestsPageClient from "@/components/organization/requests/requests-page-client";
import Loading from "./loading";

export default function RequestsPage() {
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
