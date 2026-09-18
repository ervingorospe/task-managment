"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/buttons/button";
import { DataTable } from "@/components/ui/data-table";
import TicketFormModal from "./ticket-form-modal";
import { TicketList } from "./ticket-list";
import {
  TicketFilterDropdown,
  emptyTicketFilter,
  type TicketFilterState,
} from "./ticket-filter-dropdown";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { usePageQueryParam } from "@/hooks/use-page-query-param";
import { isTicketIncluded } from "@/lib/helper/ticket-access";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketFormValues } from "@/lib/schemas/ticket.schema";

interface TicketsPageClientProps {
  organization: OrganizationDetail;
}

export default function TicketsPageClient({
  organization,
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

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TicketFilterState>(emptyTicketFilter);
  const [page, setPage] = usePageQueryParam("page");
  const [pageSize, setPageSize] = useState(15);

  const [allOrganizations, setAllOrganizations] = useState<
    OrganizationDetail[]
  >([organization]);

  // ticket.view.all sees everything; ticket.view.included (or nothing) only
  // sees tickets the current user requested or is assigned to.
  const viewableTickets = useMemo(() => {
    if (canViewAllTickets) return tickets;
    return tickets.filter((t) => isTicketIncluded(t, currentUser?.id));
  }, [tickets, canViewAllTickets, currentUser?.id]);

  // Search, then filter, then paginate — each step operates on the
  // previous step's result, same ordering used for MembersSection earlier.
  const searched = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return viewableTickets;
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

      return true;
    });
  }, [searched, filter]);

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(value: TicketFilterState) {
    setFilter(value);
    setPage(1);
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size);
    setPage(1);
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

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every ticket in {organization.organizationName}.
          </p>
        </div>
        <Can action={PERMISSIONS.TICKET_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} className="mr-1.5" /> Create ticket
          </Button>
        </Can>
      </div>

      <div className="mt-6">
        <DataTable
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search tickets by name"
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
