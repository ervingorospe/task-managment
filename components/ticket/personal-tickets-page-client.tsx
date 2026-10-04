"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Plus, Tag as TagIcon, Ticket as TicketIcon } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { DataTable } from "@/components/ui/data-table";
import { MiniStatCard, type MiniStat } from "@/components/ui/mini-stat-card";
import PersonalTicketFormModal from "./personal-ticket-form-modal";
import { TicketList } from "./ticket-list";
import {
  TicketFilterDropdown,
  emptyTicketFilter,
  type TicketFilterState,
} from "./ticket-filter-dropdown";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useTicketListQueryState } from "@/hooks/use-ticket-list-query-state";
import {
  createPersonalTicket,
  updateTicketTag,
  updateTicketStar,
  fetchPersonalTicketsPage,
  fetchPersonalTicketCountNumbers,
  type TicketCountNumbers,
} from "@/lib/api/tickets";
import { getDefaultTags } from "@/lib/data/organizations";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { PersonalTicketFormValues } from "@/lib/schemas/ticket.schema";

interface PersonalTicketsPageClientProps {
  /** Scopes the list to only starred tickets — used by the personal Starred page. */
  starredOnly?: boolean;
}

/** Same shape as TicketsPageClient, minus everything org-specific — no
 * organization/members, tags come from the fixed global set, and there's
 * no assignee/client filtering since a personal ticket has neither. */
export default function PersonalTicketsPageClient({
  starredOnly = false,
}: PersonalTicketsPageClientProps) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logTicketActivity = useLogActivity("ticket");

  const [tags, setTags] = useState<TagDetail[]>([]);
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

  useEffect(() => {
    getDefaultTags()
      .then(setTags)
      .catch(() => {
        // Status changes just won't have options until this succeeds —
        // the list itself still works.
      });
  }, []);

  const requestIdRef = useRef(0);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    const filterBy: (number | "overdue" | "starred")[] = [...filter.tagIds];
    if (filter.overdueOnly) filterBy.push("overdue");
    if (starredOnly) filterBy.push("starred");

    try {
      const result = await fetchPersonalTicketsPage(userId, {
        page,
        limit: pageSize,
        search: search || undefined,
        filterBy: filterBy.length > 0 ? filterBy : undefined,
        dueDateFrom: filter.dateFrom ?? undefined,
        dueDateTo: filter.dateTo ?? undefined,
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
  }, [userId, page, pageSize, search, filter, starredOnly, toast]);

  const loadCounts = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await fetchPersonalTicketCountNumbers(userId, {
        filterBy: starredOnly ? ["starred"] : undefined,
      });
      setCountNumbers(result);
    } catch (error) {
      notifyApiError(toast, error, "Failed to load ticket stats");
    }
  }, [userId, starredOnly, toast]);

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

  const hasActiveQuery =
    Boolean(search) ||
    filter.tagIds.length > 0 ||
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
    async (values: PersonalTicketFormValues) => {
      if (!userId) return;
      const tagId = Number(values.tagId);
      if (!Number.isFinite(tagId)) return;

      let newTicket: TicketDetail;
      try {
        newTicket = await createPersonalTicket(userId, {
          title: values.title,
          description: values.description || undefined,
          tagId,
          dueDate: values.dueDate || undefined,
        });
      } catch (error) {
        notifyApiError(toast, error, "Failed to create ticket");
        return;
      }

      loadTickets();
      loadCounts();
      logTicketActivity({
        action: "created",
        entityId: newTicket.id,
        entityLabel: newTicket.title,
        referenceId: newTicket.referenceId,
        description: `created ticket "${newTicket.title}"`,
      });
      showAlert(`New ticket ${newTicket.title} was created`);
    },
    [userId, toast, showAlert, logTicketActivity, loadTickets, loadCounts],
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
          action: "status_changed",
          entityId: ticketId,
          entityLabel: target.title,
          referenceId: target.referenceId,
          description: `changed status of "${target.title}" to ${tag.tagName}`,
        });
      }
    },
    [toast, tickets, logTicketActivity, loadCounts],
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
              ? "Tickets you've starred in your personal space."
              : "Your own standalone tickets — not tied to any organization."}
          </p>
        </div>
        {!starredOnly && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} className="mr-1.5" /> Create ticket
          </Button>
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
              members={[]}
              tags={tags}
              hideMemberFilter
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
            assignableMembers={[]}
            onChangeTag={handleChangeTag}
            onToggleStar={handleToggleStar}
            hideAssign
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

      <PersonalTicketFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        tagOptions={tags}
      />
    </div>
  );
}
