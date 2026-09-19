"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, Clock, Inbox, Plus, XCircle } from "lucide-react";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import { DataTable } from "@/components/ui/data-table";
import { MiniStatCard, type MiniStat } from "@/components/ui/mini-stat-card";
import TicketFormModal from "@/components/ticket/ticket-form-modal";
import { RequestFormModal } from "./request-form-modal";
import { RequestList } from "./request-list";
import { RejectRequestModal } from "./reject-request-modal";
import {
  RequestFilterDropdown,
  type RequestFilterState,
} from "./request-filter-dropdown";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { formatReferenceId } from "@/lib/helper/reference-id";
import { useRequestListQueryState } from "@/hooks/use-request-list-query-state";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketFormValues } from "@/lib/schemas/ticket.schema";
import type { TicketRequestFormValues } from "@/lib/schemas/ticket-request.schema";

interface RequestsPageClientProps {
  organization: OrganizationDetail;
}

export default function RequestsPageClient({
  organization,
}: RequestsPageClientProps) {
  const { currentUser, activeMembership } = useAuth();
  const toast = useToast();
  const canCreateTicket = usePermission(PERMISSIONS.TICKET_CREATE);
  const canViewAllTickets = usePermission(PERMISSIONS.TICKET_VIEW_ALL);

  // Submitting a request is a Client-only action — not a permission grant,
  // so it isn't bypassed for superadmins/owners the way <Can> would.
  const isClientRole = activeMembership?.role.roleName === "Client";

  const [requests, setRequests] = useState<TicketRequest[]>(
    organization.ticketRequests ?? [],
  );
  const [tickets, setTickets] = useState<TicketDetail[]>(
    organization.tickets ?? [],
  );

  const {
    page,
    filter,
    pageSize,
    searchInput,
    search,
    setPage,
    setFilter,
    setPageSize,
    setSearchInput,
  } = useRequestListQueryState();

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<TicketRequest | null>(
    null,
  );
  const [rejectTarget, setRejectTarget] = useState<TicketRequest | null>(
    null,
  );

  const currentMember = organization.members.find(
    (m) => m.user?.id === currentUser?.id,
  );

  // Staff with ticket.view.all see every request; everyone else (clients)
  // only sees the requests they submitted themselves.
  const visibleRequests = useMemo(() => {
    if (canViewAllTickets) return requests;
    return requests.filter((r) => r.client.id === currentMember?.id);
  }, [requests, canViewAllTickets, currentMember?.id]);

  const searched = useMemo(() => {
    if (!search) return visibleRequests;
    const query = search.toLowerCase();
    return visibleRequests.filter((r) =>
      r.title.toLowerCase().includes(query),
    );
  }, [visibleRequests, search]);

  const filtered = useMemo(() => {
    return searched.filter((r) => {
      if (filter.statuses.length > 0 && !filter.statuses.includes(r.status))
        return false;

      const submittedDate = r.createdAt.slice(0, 10);
      if (filter.dateFrom && submittedDate < filter.dateFrom) return false;
      if (filter.dateTo && submittedDate > filter.dateTo) return false;

      return true;
    });
  }, [searched, filter]);

  const pendingCount = useMemo(
    () => visibleRequests.filter((r) => r.status === "pending").length,
    [visibleRequests],
  );
  const approvedCount = useMemo(
    () => visibleRequests.filter((r) => r.status === "approved").length,
    [visibleRequests],
  );
  const rejectedCount = useMemo(
    () => visibleRequests.filter((r) => r.status === "rejected").length,
    [visibleRequests],
  );

  const statTiles: MiniStat[] = useMemo(
    () => [
      {
        label: "Total",
        value: visibleRequests.length,
        icon: Inbox,
        tint: "bg-accent-subtle",
        iconColor: "text-accent-text",
        valueColor: "text-ink",
        barColor: "bg-accent",
      },
      {
        label: "Pending",
        value: pendingCount,
        icon: Clock,
        tint: pendingCount > 0 ? "bg-warning-subtle" : "bg-canvas",
        iconColor: pendingCount > 0 ? "text-warning" : "text-ink-faint",
        valueColor: pendingCount > 0 ? "text-warning" : "text-ink",
        barColor: pendingCount > 0 ? "bg-warning" : "bg-line",
      },
      {
        label: "Approved",
        value: approvedCount,
        icon: CheckCircle2,
        tint: "bg-accent-subtle",
        iconColor: "text-accent-text",
        valueColor: "text-ink",
        barColor: "bg-accent",
      },
      {
        label: "Rejected",
        value: rejectedCount,
        icon: XCircle,
        tint: rejectedCount > 0 ? "bg-danger-subtle" : "bg-canvas",
        iconColor: rejectedCount > 0 ? "text-danger" : "text-ink-faint",
        valueColor: "text-ink",
        barColor: rejectedCount > 0 ? "bg-danger" : "bg-line",
      },
    ],
    [visibleRequests.length, pendingCount, approvedCount, rejectedCount],
  );

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  const handleFilterChange = useCallback(
    (value: RequestFilterState) => {
      setFilter(value);
    },
    [setFilter],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
    },
    [setPageSize],
  );

  const handleCreateRequest = useCallback(
    (values: TicketRequestFormValues) => {
      if (!currentMember) return;

      const newRequest: TicketRequest = {
        id: Date.now(),
        referenceId: formatReferenceId("req", requests.length + 1),
        orgId: organization.id,
        title: values.title,
        description: values.description || undefined,
        attachments: values.attachments.map((file, i) => ({
          id: Date.now() + i,
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
        })),
        ticketId: null,
        client: currentMember,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setRequests((prev) => [newRequest, ...prev]);
      toast(`Request "${newRequest.title}" submitted`);
      // TODO: POST /organizations/:orgId/ticket-requests
    },
    [currentMember, requests.length, organization.id, toast],
  );

  const handleReject = useCallback(
    (remarks: string) => {
      if (!rejectTarget) return;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === rejectTarget.id
            ? {
                ...r,
                status: "rejected",
                remarks,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      toast(`Request "${rejectTarget.title}" rejected`, "error");
      // TODO: PATCH /ticket-requests/:id { status: "rejected", remarks }
    },
    [rejectTarget, toast],
  );

  const handleApproveSubmit = useCallback(
    (values: TicketFormValues) => {
      if (!approveTarget) return;

      const targetTodoTag =
        organization.tags.find((t) => t.tagName === "To Do") ??
        organization.tags[0];
      if (!targetTodoTag) return;

      const newAttachments = values.attachments.map((file, i) => ({
        id: Date.now() + i,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      }));

      const newTicket: TicketDetail = {
        id: Date.now(),
        referenceId: formatReferenceId("tckt", tickets.length + 1),
        orgId: organization.id,
        title: values.title,
        description: values.description || undefined,
        // Carries over whatever the client attached to the request, plus
        // anything staff additionally attached while approving.
        attachments: [...approveTarget.attachments, ...newAttachments],
        tag: targetTodoTag,
        client:
          organization.members.find(
            (m) => String(m.id) === values.clientId,
          ) ?? approveTarget.client,
        assignees: organization.members.filter((m) =>
          values.assigneeIds.includes(m.id),
        ),
        dueDate: values.dueDate || null,
        starred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTickets((prev) => [newTicket, ...prev]);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === approveTarget.id
            ? {
                ...r,
                status: "approved",
                ticketId: newTicket.id,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      toast(`Request approved — ticket "${newTicket.title}" created`);
      setApproveTarget(null);
      // TODO: POST /organizations/:orgId/tickets (from request), then
      // PATCH /ticket-requests/:id { status: "approved", ticket_id }
    },
    [approveTarget, organization, tickets.length, toast],
  );

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Requests</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {canViewAllTickets
              ? `Ticket requests submitted by clients of ${organization.organizationName}.`
              : `Requests you've submitted to ${organization.organizationName}.`}
          </p>
        </div>

        {isClientRole && (
          <Button onClick={() => setRequestModalOpen(true)}>
            <Plus size={15} className="mr-1.5" /> New request
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-lg sm:grid-cols-4">
        {statTiles.map((stat) => (
          <MiniStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6">
        <DataTable
          search={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search requests by title (3+ characters)"
          filterAction={
            <RequestFilterDropdown value={filter} onChange={handleFilterChange} />
          }
          page={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        >
          <div className="px-4">
            <RequestList
              requests={paginated}
              canManage={canCreateTicket}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
              emptyTitle={
                canViewAllTickets ? "No requests yet" : "No requests submitted"
              }
              emptySubtitle={
                canViewAllTickets
                  ? "Requests submitted by clients will show up here."
                  : 'Use "New request" to ask the team for a new ticket.'
              }
            />
          </div>
        </DataTable>
      </div>

      <RequestFormModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

      {approveTarget && (
        <TicketFormModal
          open={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          onSubmit={handleApproveSubmit}
          organizations={[organization]}
          currentOrganizationId={organization.id}
          title="Approve request"
          initialValues={{
            title: approveTarget.title,
            description: approveTarget.description ?? "",
            clientId: String(approveTarget.client.id),
          }}
          existingAttachments={approveTarget.attachments}
        />
      )}

      <RejectRequestModal
        request={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
      />
    </div>
  );
}
