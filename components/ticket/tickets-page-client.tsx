"use client";

import { useMemo, useState } from "react";
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
  type TicketFilterState,
} from "./ticket-filter-dropdown";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useTicketListQueryState } from "@/hooks/use-ticket-list-query-state";
import { isTicketIncluded } from "@/lib/helper/ticket-access";
import { getDueState } from "@/lib/helper/ticket-status";
import { getStatusBreakdown } from "@/lib/helper/ticket-reports";
import { formatReferenceId } from "@/lib/helper/reference-id";
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
  const canViewAllTickets = usePermission(PERMISSIONS.TICKET_VIEW_ALL);
  const { tags, members } = organization;
  const assignableMembers = members.filter(
    (m) => m.role?.roleName !== "Client",
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

  const overdueCount = viewableTickets.filter(
    (t) => getDueState(t) === "overdue",
  ).length;
  const statusRows = getStatusBreakdown(viewableTickets);

  const statTiles: MiniStat[] = [
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
  ];

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleFilterChange(value: TicketFilterState) {
    setFilter(value);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
  }

  function handleCreate(values: TicketFormValues) {
    const targetOrg =
      allOrganizations.find((o) => String(o.id) === values.organizationId) ??
      organization;
    const targetTodoTag =
      targetOrg.tags.find((t) => t.tagName === "To Do") ?? targetOrg.tags[0];
    if (!targetTodoTag) return;

    const newTicket: TicketDetail = {
      id: Date.now(),
      referenceId: formatReferenceId("tckt", targetOrg.tickets.length + 1),
      orgId: targetOrg.id,
      title: values.title,
      description: values.description || undefined,
      attachments: values.attachments.map((file, i) => ({
        id: Date.now() + i,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
      })),
      tag: targetTodoTag,
      client:
        targetOrg.members.find((m) => String(m.id) === values.clientId) ?? null,
      assignees: targetOrg.members.filter((m) =>
        values.assigneeIds.includes(m.id),
      ),
      dueDate: values.dueDate || null,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (targetOrg.id === organization.id) {
      setTickets((prev) => [newTicket, ...prev]);
    }
    toast(`Ticket "${newTicket.title}" created`);
    // TODO: POST /organizations/:orgId/tickets in the background.
  }

  function handleChangeTag(ticketId: number, tag: TagDetail) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, tag } : t)),
    );
    toast(`Status changed to "${tag.tagName}"`);
    // TODO: PATCH /tickets/:id { tag_id: tag.id }
  }

  function handleAssign(ticketId: number, memberIds: number[]) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, assignees: members.filter((m) => memberIds.includes(m.id)) }
          : t,
      ),
    );
    toast("Assignees updated");
    // TODO: PATCH /tickets/:id { assignee_ids: memberIds }
  }

  function handleToggleStar(ticketId: number) {
    let nowStarred = false;
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        nowStarred = !t.starred;
        return { ...t, starred: nowStarred };
      }),
    );
    toast(nowStarred ? "Ticket starred" : "Ticket unstarred");
    // TODO: PATCH /tickets/:id { starred: nowStarred }
  }

  return (
    <div>
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
            emptyTitle={starredOnly ? "No starred tickets" : undefined}
            emptySubtitle={
              starredOnly
                ? "Star a ticket from the list to pin it here."
                : undefined
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
