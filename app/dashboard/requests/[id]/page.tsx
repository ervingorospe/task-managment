import { notFound } from "next/navigation";
import { getTicketRequestById } from "@/lib/data/organization-detail";
import MemberGuard from "@/components/auth/member-guard";
import RequestAccessGuard from "@/components/auth/request-access-guard";
import RequestDetailClient from "@/components/organization/requests/request-detail-client";

interface RequestPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestPage({ params }: RequestPageProps) {
  const { id } = await params;
  const requestId = Number(id);

  if (!Number.isFinite(requestId)) notFound();

  const result = await getTicketRequestById(requestId);
  if (!result) notFound();

  const { request, organization } = result;

  return (
    <MemberGuard organizationId={organization.id}>
      <RequestAccessGuard request={request}>
        <RequestDetailClient request={request} organization={organization} />
      </RequestAccessGuard>
    </MemberGuard>
  );
}
