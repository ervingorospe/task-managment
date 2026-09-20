"use client";

import { useMemo } from "react";
import { History } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ActivityFilterDropdown } from "./activity-filter-dropdown";
import { ActivityLogList } from "./activity-log-list";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useAuth, hasPermission } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { useActivityLogQueryState } from "@/hooks/use-activity-log-query-state";
import { PageHeaderSkeleton, ListSkeleton } from "@/components/ui/skeletons";
import { PERMISSIONS } from "@/lib/data/permissions";
import { isActivityEntryIncluded } from "@/lib/helper/activity-access";

export default function ActivityLogClient() {
  const { activeOrganization, activeMembership, currentUser } = useAuth();
  const { entries } = useActivityLog();
  const organization = useActiveOrganizationDetail();

  const { page, filter, pageSize, setPage, setFilter, setPageSize } =
    useActivityLogQueryState();

  const canViewAll = hasPermission(
    activeMembership?.role.rules ?? [],
    PERMISSIONS.ACTIVITY_LOG_VIEW_ALL,
  );

  const orgEntries = useMemo(
    () => entries.filter((entry) => entry.orgId === activeOrganization?.id),
    [entries, activeOrganization?.id],
  );

  /**
   * activity.log.view.all sees every entry; activity.log.view.included only
   * sees entries they acted in, or that touch a ticket/request/membership
   * they're part of — mirrors ticket.view.included.
   */
  const visibleEntries = useMemo(() => {
    if (canViewAll) return orgEntries;
    return orgEntries.filter((entry) =>
      isActivityEntryIncluded(entry, currentUser?.id),
    );
  }, [orgEntries, canViewAll, currentUser?.id]);

  const authors = useMemo(() => {
    const seen = new Map<number, string>();
    for (const entry of visibleEntries) {
      if (!seen.has(entry.actorId)) seen.set(entry.actorId, entry.actorName);
    }
    return Array.from(seen, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [visibleEntries]);

  const filtered = useMemo(() => {
    return visibleEntries.filter((entry) => {
      if (
        filter.modules.length > 0 &&
        !filter.modules.includes(entry.module)
      )
        return false;

      if (
        filter.authorIds.length > 0 &&
        !filter.authorIds.includes(entry.actorId)
      )
        return false;

      const entryDate = entry.createdAt.slice(0, 10);
      if (filter.dateFrom && entryDate < filter.dateFrom) return false;
      if (filter.dateTo && entryDate > filter.dateTo) return false;

      return true;
    });
  }, [visibleEntries, filter]);

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );

  if (!activeOrganization) {
    return (
      <div>
        <div>
          <h1 className="text-lg font-semibold text-ink">Activity Log</h1>
          <p className="mt-1 text-sm text-ink-muted">
            A history of every action taken across your organization.
          </p>
        </div>
        <EmptyState subtitle="Join or create an organization to see its activity." />
      </div>
    );
  }

  if (!organization) {
    return (
      <div>
        <PageHeaderSkeleton />
        <div className="mt-6">
          <ListSkeleton rows={8} withLeading={false} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Activity Log</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every action taken in {organization.organizationName}.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <span className="flex items-center gap-1.5 text-sm text-ink-muted">
            <History size={14} />
            {filtered.length} action{filtered.length === 1 ? "" : "s"}
          </span>

          <ActivityFilterDropdown
            value={filter}
            onChange={setFilter}
            authors={authors}
          />
        </div>

        <ActivityLogList entries={paginated} />

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
}
