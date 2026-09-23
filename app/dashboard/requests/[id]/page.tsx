"use client";

import { useParams, notFound } from "next/navigation";
import { useTicketRequestById } from "@/hooks/use-ticket-request-by-id";
import MemberGuard from "@/components/auth/member-guard";
import RequestAccessGuard from "@/components/auth/request-access-guard";
import RequestDetailClient from "@/components/organization/requests/request-detail-client";
import Loading from "./loading";

export default function RequestPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);

  const { request, organization, loading, notFound: requestNotFound } =
    useTicketRequestById(requestId);

  if (!Number.isFinite(requestId)) notFound();
  if (loading) return <Loading />;
  if (requestNotFound || !request || !organization) notFound();

  return (
    <MemberGuard
      organizationId={organization.id}
      organizationName={organization.organizationName}
      isActive={organization.settings.isActive}
    >
      <RequestAccessGuard request={request}>
        <RequestDetailClient request={request} organization={organization} />
      </RequestAccessGuard>
    </MemberGuard>
  );
}
