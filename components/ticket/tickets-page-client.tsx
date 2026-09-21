"use client";

import { useCallback, useMemo, useState } from "react";
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
import { isTicketIncluded } from "@/lib/helper/ticket-access";
import { getDueState } from "@/lib/helper/ticket-status";
import { getStatusBreakdown } from "@/lib/helper/ticket-reports";
import { createTicket, updateTicket } from "@/lib/api/tickets";
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

  const [tickets, setTickets] = useState<TicketDetail[]>(
    organization.tickets ?? [],
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
  // sees tickets the current user requested or is assigned to.
  const viewableTickets = useMemo(() => {
    const base = canViewAllTickets
      ? tickets
      : tickets.filter((t) => isTicketIncluded(t, currentUser?.id));
    return starredOnly ? base.filter((t) => t.starred) : base;
  }, [tickets, canViewAllTickets, currentUser?.id, starredOnly]);

  // Search, then filter, then paginate — each step operates on the
  // previous step's result, same ordering used for MembersSection earlier.
  const searched = useMemo(() => {
    if (!search) return viewableTickets;
    const query = search.toLowerCase();
    return viewableTickets.filter((t) =>
      t.title.toLowerCase().includes(query),
    );
  }, [viewableTickets, search]);

  const filtered = useMemo(() => {
    return searched.filter((ticket) => {
      if (filter.tagIds.length > 0 && !filter.tagIds.includes(ticket.tag.id))
        return false;

      if (filter.memberIds.length > 0) {
        const hasMatch = ticket.assignees.some((m) =>
          filter.memberIds.includes(m.id),
        );
        if (!hasMatch) return false;
      }

      if (
        filter.dateFrom &&
        (!ticket.dueDate || ticket.dueDate < filter.dateFrom)
      )
        return false;
      if (filter.dateTo && (!ticket.dueDate || ticket.dueDate > filter.dateTo))
        return false;

      if (filter.overdueOnly && getDueState(ticket) !== "overdue")
        return false;

      return true;
    });
  }, [searched, filter]);

  const overdueCount = useMemo(
    () => viewableTickets.filter((t) => getDueState(t) === "overdue").length,
    [viewableTickets],
  );
  const statusRows = useMemo(
    () => getStatusBreakdown(viewableTickets),
    [viewableTickets],
  );

  const statTiles: MiniStat[] = useMemo(
    () => [
      {
        label: "Total",
        value: viewableTickets.length,
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
    ],
    [viewableTickets.length, overdueCount, statusRows],
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
    filter.tagIds.length > 0 ||
    filter.memberIds.length > 0 ||
    Boolean(filter.dateFrom) ||
    Boolean(filter.dateTo) ||
    filter.overdueOnly;
  const noResultsFromQuery =
    viewableTickets.length > 0 && filtered.length === 0 && hasActiveQuery;

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
        setTickets((prev) => [newTicket, ...prev]);
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
    [allOrganizations, organization, toast, showAlert, logTicketActivity],
  );

  const handleChangeTag = useCallback(
    (ticketId: number, tag: TagDetail) => {
      const target = tickets.find((t) => t.id === ticketId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, tag } : t)),
      );

      updateTicket(ticketId, { tagId: tag.id }).catch((error) => {
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
    [toast, tickets, organization.id, logTicketActivity],
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

      updateTicket(ticketId, { assigneeIds: memberIds }).catch((error) => {
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

      updateTicket(ticketId, { starred: nowStarred }).catch((error) => {
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
    [tickets, toast],
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
          searchPlaceholder="Search tickets by name (3+ characters)"
          filterAction={
            <TicketFilterDropdown
              value={filter}
              onChange={handleFilterChange}
              members={members}
              tags={tags}
            />
          }
          page={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        >
          <TicketList
            tickets={paginated}
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
