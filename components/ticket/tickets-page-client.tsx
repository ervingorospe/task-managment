"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Plus, Tag as TagIcon, Ticket as TicketIcon } from "lucide-react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import { DataTable } from "@/components/ui/data-table";
import { MiniStatCard, type MiniStat } from "@/components/ui/mini-stat-card";
import TicketFormModal from "./ticket-form-modal";
import { TicketList } from "./ticket-list";
import {
  TicketFilterDropdown,
  emptyTicketFilter,
  type TicketFilterState,
} from "./ticket-filter-dropdown";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useTicketListQueryState } from "@/hooks/use-ticket-list-query-state";
import {
  createTicket,
  updateTicketTag,
  updateTicketAssignees,
  updateTicketStar,
  fetchTicketsPage,
  fetchTicketCountNumbers,
  type TicketCountNumbers,
} from "@/lib/api/tickets";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketFormValues } from "@/lib/schemas/ticket.schema";

interface TicketsPageClientProps {
  organization: OrganizationDetail;
  /** Scopes the list to only the current user's starred tickets — used by the Starred page. */
  starredOnly?: boolean;
}

export default function TicketsPageClient({
  organization,
  starredOnly = false,
}: TicketsPageClientProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logTicketActivity = useLogActivity("ticket");
  const canViewAllTickets = usePermission(PERMISSIONS.TICKET_VIEW_ALL);
  const { tags, members } = organization;
  const assignableMembers = useMemo(
    () => members.filter((m) => m.role?.roleName !== "Client"),
    [members],
  );

  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [countNumbers, setCountNumbers] = useState<TicketCountNumbers | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

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
  } = useTicketListQueryState();

  const [allOrganizations, setAllOrganizations] = useState<
    OrganizationDetail[]
  >([organization]);

  // ticket.view.all sees everything; ticket.view.included (or nothing) only
  // sees tickets the current user requested or is assigned to. When that's
  // the case but the user id isn't known yet, fall back to an id no member
  // can have rather than an unscoped fetch, so the list stays empty instead
  // of briefly leaking every ticket.
  const involvesUserId = canViewAllTickets
    ? undefined
    : (currentUser?.id ?? -1);

  const requestIdRef = useRef(0);

  const loadTickets = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    const filterBy: (number | "overdue" | "starred")[] = [
      ...filter.tagIds,
    ];
    if (filter.overdueOnly) filterBy.push("overdue");
    if (starredOnly) filterBy.push("starred");

    try {
      const result = await fetchTicketsPage(organization.id, {
        page,
        limit: pageSize,
        search: search || undefined,
        filterBy: filterBy.length > 0 ? filterBy : undefined,
        memberIds:
          filter.memberIds.length > 0 ? filter.memberIds : undefined,
        dueDateFrom: filter.dateFrom ?? undefined,
        dueDateTo: filter.dateTo ?? undefined,
        involvesUserId,
      });
      if (requestId !== requestIdRef.current) return;
      setTickets(result.items);
      setTotal(result.total);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      notifyApiError(toast, error, "Failed to load tickets");
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, [
    organization.id,
    page,
    pageSize,
    search,
    filter,
    starredOnly,
    involvesUserId,
    toast,
  ]);

  const loadCounts = useCallback(async () => {
    try {
      const result = await fetchTicketCountNumbers(organization.id, {
        filterBy: starredOnly ? ["starred"] : undefined,
        involvesUserId,
      });
      setCountNumbers(result);
    } catch (error) {
      notifyApiError(toast, error, "Failed to load ticket stats");
    }
  }, [organization.id, starredOnly, involvesUserId, toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const statTiles: MiniStat[] = useMemo(() => {
    const totalTickets = countNumbers?.totalTickets ?? 0;
    const overdueCount = countNumbers?.overdues ?? 0;
    const statusRows = [...(countNumbers?.countPerTag ?? [])].sort(
      (a, b) => b.count - a.count,
    );

    return [
      {
        label: "Total",
        value: totalTickets,
        icon: TicketIcon,
        tint: "bg-accent-subtle",
        iconColor: "text-accent-text",
        valueColor: "text-ink",
        barColor: "bg-accent",
      },
      {
        label: "Overdue",
        value: overdueCount,
        icon: AlertTriangle,
        tint: overdueCount > 0 ? "bg-danger-subtle" : "bg-canvas",
        iconColor: overdueCount > 0 ? "text-danger" : "text-ink-faint",
        valueColor: overdueCount > 0 ? "text-danger" : "text-ink",
        barColor: overdueCount > 0 ? "bg-danger" : "bg-line",
      },
      ...statusRows.map((row) => ({
        label: row.tagName,
        value: row.count,
        icon: TagIcon,
        accentColor: row.color,
      })),
    ];
  }, [countNumbers]);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  // Distinguishes "nothing exists yet" from "your search/filters matched
  // nothing" so the empty state points at the right fix.
  const hasActiveQuery =
    Boolean(search) ||
    filter.tagIds.length > 0 ||
    filter.memberIds.length > 0 ||
    Boolean(filter.dateFrom) ||
    Boolean(filter.dateTo) ||
    filter.overdueOnly;
  const noResultsFromQuery =
    !isLoading &&
    (countNumbers?.totalTickets ?? 0) > 0 &&
    total === 0 &&
    hasActiveQuery;

  const handleClearFilters = useCallback(() => {
    setFilter(emptyTicketFilter);
    setSearchInput("");
  }, [setFilter, setSearchInput]);

  const handleFilterChange = useCallback(
    (value: TicketFilterState) => {
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

  const handleCreate = useCallback(
    async (values: TicketFormValues) => {
      const targetOrg =
        allOrganizations.find(
          (o) => String(o.id) === values.organizationId,
        ) ?? organization;
      const targetTodoTag =
        targetOrg.tags.find((t) => t.tagName === "To Do") ?? targetOrg.tags[0];
      if (!targetTodoTag) return;

      const client =
        targetOrg.members.find((m) => String(m.id) === values.clientId) ??
        null;
      const assignees = targetOrg.members.filter((m) =>
        values.assigneeIds.includes(m.id),
      );

      let newTicket: TicketDetail;
      try {
        newTicket = await createTicket(targetOrg.id, {
          title: values.title,
          description: values.description || undefined,
          tagId: targetTodoTag.id,
          clientId: client?.id,
          assigneeIds: assignees.map((m) => m.id),
          dueDate: values.dueDate || undefined,
        });
      } catch (error) {
        notifyApiError(toast, error, "Failed to create ticket");
        return;
      }

      if (targetOrg.id === organization.id) {
        loadTickets();
        loadCounts();
      }
      logTicketActivity({
        orgId: targetOrg.id,
        action: "created",
        entityId: newTicket.id,
        entityLabel: newTicket.title,
        referenceId: newTicket.referenceId,
        involvedUserIds: [
          newTicket.client?.user?.id,
          ...newTicket.assignees.map((a) => a.user?.id),
        ],
        description: `created ticket "${newTicket.title}"`,
      });
      showAlert(`New ticket ${newTicket.title} was created`);
    },
    [
      allOrganizations,
      organization,
      toast,
      showAlert,
      logTicketActivity,
      loadTickets,
      loadCounts,
    ],
  );

  const handleChangeTag = useCallback(
    (ticketId: number, tag: TagDetail) => {
      const target = tickets.find((t) => t.id === ticketId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, tag } : t)),
      );

      updateTicketTag(ticketId, tag.id)
        .then(() => loadCounts())
        .catch((error) => {
          if (target) {
            setTickets((prev) =>
              prev.map((t) => (t.id === ticketId ? target : t)),
            );
          }
          notifyApiError(toast, error, "Failed to update status");
        });

      if (target) {
        logTicketActivity({
          orgId: organization.id,
          action: "status_changed",
          entityId: ticketId,
          entityLabel: target.title,
          referenceId: target.referenceId,
          involvedUserIds: [
            target.client?.user?.id,
            ...target.assignees.map((a) => a.user?.id),
          ],
          description: `changed status of "${target.title}" to ${tag.tagName}`,
        });
      }
    },
    [toast, tickets, organization.id, logTicketActivity, loadCounts],
  );

  const handleAssign = useCallback(
    (ticketId: number, memberIds: number[]) => {
      const target = tickets.find((t) => t.id === ticketId);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                assignees: members.filter((m) => memberIds.includes(m.id)),
              }
            : t,
        ),
      );

      updateTicketAssignees(ticketId, memberIds).catch((error) => {
        if (target) {
          setTickets((prev) =>
            prev.map((t) => (t.id === ticketId ? target : t)),
          );
        }
        notifyApiError(toast, error, "Failed to update assignees");
      });

      if (target) {
        const newAssignees = members.filter((m) => memberIds.includes(m.id));
        logTicketActivity({
          orgId: organization.id,
          action: "assigned",
          entityId: ticketId,
          entityLabel: target.title,
          referenceId: target.referenceId,
          involvedUserIds: [
            target.client?.user?.id,
            ...target.assignees.map((a) => a.user?.id),
            ...newAssignees.map((a) => a.user?.id),
          ],
          description: `updated assignees on "${target.title}"`,
        });
      }
    },
    [members, toast, tickets, organization.id, logTicketActivity],
  );

  const handleToggleStar = useCallback(
    (ticketId: number) => {
      const target = tickets.find((t) => t.id === ticketId);
      if (!target) return;
      const nowStarred = !target.starred;

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, starred: nowStarred } : t)),
      );

      updateTicketStar(ticketId, nowStarred)
        .then(() => {
          // On the Starred page, a ticket leaving the star selection must
          // actually leave the list (and be backfilled by the next one)
          // rather than just flip its icon in place — that needs a real
          // refetch, since the current page is a server-side slice, not
          // the full set. The stat tiles are also scoped to "starred", so
          // they need refreshing too.
          if (starredOnly) {
            loadTickets();
            loadCounts();
          }
        })
        .catch((error) => {
          setTickets((prev) =>
            prev.map((t) => (t.id === ticketId ? target : t)),
          );
          notifyApiError(
            toast,
            error,
            `Failed to ${nowStarred ? "star" : "unstar"} ticket`,
          );
        });
    },
    [tickets, toast, starredOnly, loadTickets, loadCounts],
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
          <h1 className="text-lg font-semibold text-ink">
            {starredOnly ? "Starred" : "Tickets"}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {starredOnly
              ? `Tickets you've starred in ${organization.organizationName}.`
              : `Every ticket in ${organization.organizationName}.`}
          </p>
        </div>
        {!starredOnly && (
          <Can action={PERMISSIONS.TICKET_CREATE}>
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={15} className="mr-1.5" /> Create ticket
            </Button>
          </Can>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
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
            <TicketFilterDropdown
              value={filter}
              onChange={handleFilterChange}
              members={members}
              tags={tags}
            />
          }
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        >
          <TicketList
            tickets={tickets}
            availableTags={tags}
            assignableMembers={assignableMembers}
            onChangeTag={handleChangeTag}
            onAssign={handleAssign}
            onToggleStar={handleToggleStar}
            emptyTitle={
              noResultsFromQuery
                ? "No matching tickets"
                : starredOnly
                  ? "No starred tickets"
                  : undefined
            }
            emptySubtitle={
              noResultsFromQuery
                ? "Try adjusting your search or filters."
                : starredOnly
                  ? "Star a ticket from the list to pin it here."
                  : undefined
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
        </DataTable>
      </div>

      <TicketFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        organizations={allOrganizations}
        currentOrganizationId={organization.id}
      />
    </div>
  );
}
