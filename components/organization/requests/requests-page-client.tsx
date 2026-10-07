"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Inbox, Plus, XCircle } from "lucide-react";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import { DataTable } from "@/components/ui/data-table";
import { MiniStatCard, type MiniStat } from "@/components/ui/mini-stat-card";
import TicketFormModal from "@/components/ticket/ticket-form-modal";
import { RequestFormModal } from "./request-form-modal";
import { RequestList } from "./request-list";
import { RejectRequestModal } from "./reject-request-modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import {
  RequestFilterDropdown,
  emptyRequestFilter,
  type RequestFilterState,
} from "./request-filter-dropdown";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useRequestListQueryState } from "@/hooks/use-request-list-query-state";
import { useResourceEvents } from "@/hooks/use-resource-events";
import {
  createTicketRequest,
  rejectTicketRequest,
  approveTicketRequest,
  cancelTicketRequest,
  fetchAllTicketRequests,
} from "@/lib/api/ticket-requests";
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
  const router = useRouter();
  const { currentUser, activeMembership } = useAuth();
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logRequestActivity = useLogActivity("request");
  const logTicketActivity = useLogActivity("ticket");
  const canCreateTicket = usePermission(PERMISSIONS.TICKET_CREATE);
  const canViewAllTickets = usePermission(PERMISSIONS.TICKET_VIEW_ALL);

  // Submitting a request is a Client-only action — not a permission grant,
  // so it isn't bypassed for superadmins/owners the way <Can> would.
  const isClientRole = activeMembership?.role.roleName === "Client";

  const [requests, setRequests] = useState<TicketRequest[]>(
    organization.ticketRequests,
  );
  const [tickets, setTickets] = useState<TicketDetail[]>(organization.tickets);

  // Live push — unlike the org tickets list, this page's data comes from
  // the org-detail payload passed in as a prop, not its own paginated
  // fetch, so a signal re-fetches just the requests list directly rather
  // than re-running a query-state-driven load function.
  const refetchRequests = useCallback(() => {
    fetchAllTicketRequests(organization.id)
      .then(setRequests)
      .catch((error) => {
        notifyApiError(toast, error, "Failed to refresh requests");
      });
  }, [organization.id, toast]);
  useResourceEvents(organization.id, "REQUEST", refetchRequests);

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
  const [cancelTarget, setCancelTarget] = useState<TicketRequest | null>(
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
    return visibleRequests.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.referenceId.toLowerCase().includes(query),
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

  // Distinguishes "nothing exists yet" from "your search/filters matched
  // nothing" so the empty state points at the right fix.
  const hasActiveQuery =
    Boolean(search) ||
    filter.statuses.length > 0 ||
    Boolean(filter.dateFrom) ||
    Boolean(filter.dateTo);
  const noResultsFromQuery =
    visibleRequests.length > 0 && filtered.length === 0 && hasActiveQuery;

  const handleClearFilters = useCallback(() => {
    setFilter(emptyRequestFilter);
    setSearchInput("");
  }, [setFilter, setSearchInput]);

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
    async (values: TicketRequestFormValues) => {
      if (!currentMember) return;

      let newRequest: TicketRequest;
      try {
        newRequest = await createTicketRequest(organization.id, {
          clientId: currentMember.id,
          title: values.title,
          description: values.description || undefined,
        });
      } catch (error) {
        notifyApiError(toast, error, "Failed to submit request");
        return;
      }

      setRequests((prev) => [newRequest, ...prev]);
      logRequestActivity({
        orgId: organization.id,
        action: "created",
        entityId: newRequest.id,
        entityLabel: newRequest.title,
        referenceId: newRequest.referenceId,
        involvedUserIds: [newRequest.client.user?.id],
        description: `submitted request "${newRequest.title}"`,
      });
      showAlert(`Request "${newRequest.title}" submitted`);
    },
    [currentMember, organization.id, toast, showAlert, logRequestActivity],
  );

  const handleReject = useCallback(
    // Only ever invoked as RejectRequestModal's onConfirm, which only
    // opens (via `open={!!request}`) once rejectTarget is already set.
    async (remarks: string) => {
      const target = rejectTarget!;

      try {
        await rejectTicketRequest(target.id, remarks);
      } catch (error) {
        notifyApiError(toast, error, "Failed to reject request");
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? {
                ...r,
                status: "rejected",
                remarks,
                updatedAt: new Date().toISOString(),
              }
            : r,
        ),
      );
      logRequestActivity({
        orgId: organization.id,
        action: "rejected",
        entityId: target.id,
        entityLabel: target.title,
        referenceId: target.referenceId,
        involvedUserIds: [target.client.user?.id],
        description: `rejected request "${target.title}": ${remarks}`,
      });
      showAlert(`Request "${target.title}" rejected`, "error");
    },
    [rejectTarget, toast, showAlert, organization.id, logRequestActivity],
  );

  const handleCancel = useCallback(
    async (target: TicketRequest) => {
      try {
        await cancelTicketRequest(target.id);
      } catch (error) {
        notifyApiError(toast, error, "Failed to cancel request");
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === target.id
            ? { ...r, status: "cancelled", updatedAt: new Date().toISOString() }
            : r,
        ),
      );
      logRequestActivity({
        orgId: organization.id,
        action: "cancelled",
        entityId: target.id,
        entityLabel: target.title,
        referenceId: target.referenceId,
        involvedUserIds: [target.client.user?.id],
        description: `cancelled request "${target.title}"`,
      });
      showAlert(`Request "${target.title}" cancelled`, "error");
    },
    [toast, organization.id, showAlert, logRequestActivity],
  );

  const handleApproveSubmit = useCallback(
    // Only ever invoked as the approve TicketFormModal's onSubmit, which
    // only renders (via `{approveTarget && (...)}`) once approveTarget is
    // already set.
    async (values: TicketFormValues) => {
      const target = approveTarget!;

      const targetTodoTag =
        organization.tags.find((t) => t.tagName === "To Do") ??
        organization.tags[0];
      if (!targetTodoTag) return;

      let result: { request: TicketRequest; ticket: TicketDetail };
      try {
        result = await approveTicketRequest(target.id, {
          tagId: targetTodoTag.id,
          assigneeIds: values.assigneeIds,
          dueDate: values.dueDate || undefined,
        });
      } catch (error) {
        notifyApiError(toast, error, "Failed to approve request");
        return;
      }

      const { request: updatedRequest, ticket: newTicket } = result;

      setTickets((prev) => [newTicket, ...prev]);
      setRequests((prev) =>
        prev.map((r) => (r.id === target.id ? updatedRequest : r)),
      );
      logRequestActivity({
        orgId: organization.id,
        action: "approved",
        entityId: target.id,
        entityLabel: target.title,
        referenceId: target.referenceId,
        involvedUserIds: [target.client.user?.id],
        description: `approved request "${target.title}"`,
      });
      logTicketActivity({
        orgId: organization.id,
        action: "created",
        entityId: newTicket.id,
        entityLabel: newTicket.title,
        referenceId: newTicket.referenceId,
        involvedUserIds: [
          newTicket.client?.user?.id,
          ...newTicket.assignees.map((a) => a.user?.id),
        ],
        description: `created ticket "${newTicket.title}" from a request`,
      });
      setApproveTarget(null);
      router.push(`/dashboard/tickets/${newTicket.id}`);
    },
    [
      approveTarget,
      organization,
      toast,
      router,
      logRequestActivity,
      logTicketActivity,
    ],
  );

  return (
    <div>
      {alert && (
        <InlineAlert
          message={alert.message}
          variant={alert.variant}
          onDismiss={dismissAlert}
        />
      )}

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
          searchPlaceholder="Search by title or reference ID (3+ characters)"
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
              canCancel={isClientRole}
              onApprove={setApproveTarget}
              onReject={setRejectTarget}
              onCancel={setCancelTarget}
              emptyTitle={
                noResultsFromQuery
                  ? "No matching requests"
                  : canViewAllTickets
                    ? "No requests yet"
                    : "No requests submitted"
              }
              emptySubtitle={
                noResultsFromQuery
                  ? "Try adjusting your search or filters."
                  : canViewAllTickets
                    ? "Requests submitted by clients will show up here."
                    : 'Use "New request" to ask the team for a new ticket.'
              }
              emptyAction={
                noResultsFromQuery ? (
                  <Button
                    variant="secondary"
                    className="mt-3"
                    onClick={handleClearFilters}
                  >
                    Clear filters
                  </Button>
                ) : undefined
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

      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
        title="Cancel request"
        description={
          <>
            Are you sure you want to cancel{" "}
            <strong>{cancelTarget?.title}</strong>? This can&apos;t be
            undone.
          </>
        }
        confirmLabel="Cancel request"
        cancelLabel="Keep request"
      />
    </div>
  );
}
