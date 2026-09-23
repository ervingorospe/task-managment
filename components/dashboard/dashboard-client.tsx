"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Inbox, Ticket as TicketIcon } from "lucide-react";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { StatTileCard, type StatTile } from "@/components/ui/stat-tile-card";
import { StatusPieChart } from "@/components/organization/ticket-reports/status-pie-chart";
import { StatusBreakdownChart } from "@/components/organization/ticket-reports/status-breakdown-chart";
import { TrendSeriesSelect } from "@/components/organization/ticket-reports/trend-series-select";
import { TrendLineChart } from "@/components/organization/ticket-reports/trend-line-chart";
import { RequestStatusBadge } from "@/components/organization/requests/request-status-badge";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { useOrgReportData } from "@/hooks/use-org-report-data";
import { usePersonalTicketData } from "@/hooks/use-personal-ticket-data";
import { getDefaultTags } from "@/lib/data/organizations";
import {
  getStatusBreakdown,
  getTrendSeries,
  type TrendSelection,
} from "@/lib/helper/ticket-reports";
import { getDueState, isDueThisWeek } from "@/lib/helper/ticket-status";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

export default function DashboardClient() {
  const { activeOrganization, isPersonalMode } = useAuth();
  const organization = useActiveOrganizationDetail();
  const orgData = useOrgReportData();
  const personalData = usePersonalTicketData();

  const visibleTickets = isPersonalMode ? personalData.tickets : orgData.tickets;
  const reportDataLoading = isPersonalMode
    ? personalData.loading
    : orgData.loading;
  // Requests is an org-only concept — a stable empty array in Personal
  // mode, so it doesn't itself become a fresh reference every render.
  const visibleRequests = useMemo(
    () => (isPersonalMode ? [] : orgData.requests),
    [isPersonalMode, orgData.requests],
  );

  // Personal mode has no org.tags to plot by — the fixed global tag set
  // fills the same role.
  const [personalTags, setPersonalTags] = useState<TagDetail[]>([]);
  useEffect(() => {
    if (!isPersonalMode) return;
    getDefaultTags()
      .then(setPersonalTags)
      .catch(() => {});
  }, [isPersonalMode]);
  const tags = useMemo(
    () => (isPersonalMode ? personalTags : (organization?.tags ?? [])),
    [isPersonalMode, personalTags, organization],
  );

  const [trendSelection, setTrendSelection] = useState<TrendSelection>({
    created: true,
    dueDate: false,
    tagIds: [],
  });

  const overdueCount = useMemo(
    () => visibleTickets.filter((t) => getDueState(t) === "overdue").length,
    [visibleTickets],
  );
  const dueThisWeekCount = useMemo(
    () => visibleTickets.filter(isDueThisWeek).length,
    [visibleTickets],
  );
  const pendingRequestsCount = useMemo(
    () => visibleRequests.filter((r) => r.status === "pending").length,
    [visibleRequests],
  );

  const statTiles: StatTile[] = useMemo(() => {
    const tiles: StatTile[] = [
      {
        label: "Total tickets",
        value: visibleTickets.length,
        caption: "across every status",
        icon: TicketIcon,
        tint: "bg-accent-subtle",
        iconColor: "text-accent-text",
        valueColor: "text-ink",
        barColor: "bg-accent",
      },
      {
        label: "Overdue",
        value: overdueCount,
        caption: "past their due date",
        icon: AlertTriangle,
        tint: overdueCount > 0 ? "bg-danger-subtle" : "bg-canvas",
        iconColor: overdueCount > 0 ? "text-danger" : "text-ink-faint",
        valueColor: overdueCount > 0 ? "text-danger" : "text-ink",
        barColor: overdueCount > 0 ? "bg-danger" : "bg-line",
      },
      {
        label: "Due this week",
        value: dueThisWeekCount,
        caption: "in the next 7 days",
        icon: CalendarClock,
        tint: dueThisWeekCount > 0 ? "bg-warning-subtle" : "bg-canvas",
        iconColor: dueThisWeekCount > 0 ? "text-warning" : "text-ink-faint",
        valueColor: "text-ink",
        barColor: dueThisWeekCount > 0 ? "bg-warning" : "bg-line",
      },
    ];

    // Pending requests is an org-only concept — no tile for it in Personal mode.
    if (!isPersonalMode) {
      tiles.push({
        label: "Pending requests",
        value: pendingRequestsCount,
        caption: "awaiting a decision",
        icon: Inbox,
        tint: pendingRequestsCount > 0 ? "bg-warning-subtle" : "bg-canvas",
        iconColor:
          pendingRequestsCount > 0 ? "text-warning" : "text-ink-faint",
        valueColor: pendingRequestsCount > 0 ? "text-warning" : "text-ink",
        barColor: pendingRequestsCount > 0 ? "bg-warning" : "bg-line",
      });
    }

    return tiles;
  }, [
    visibleTickets.length,
    overdueCount,
    dueThisWeekCount,
    pendingRequestsCount,
    isPersonalMode,
  ]);

  const statusRows = useMemo(
    () => getStatusBreakdown(visibleTickets),
    [visibleTickets],
  );
  const trendSeries = useMemo(
    () =>
      getTrendSeries(visibleTickets, tags, {
        selection: trendSelection,
        range: { from: null, to: null },
      }),
    [visibleTickets, tags, trendSelection],
  );

  const recentTickets = useMemo(
    () =>
      [...visibleTickets]
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 5),
    [visibleTickets],
  );

  const recentRequests = useMemo(
    () =>
      [...visibleRequests]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [visibleRequests],
  );

  if (!isPersonalMode && !activeOrganization) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">
            Here&apos;s what&apos;s moving across your organization.
          </p>
        </div>
        <EmptyState subtitle="Join or create an organization to see your dashboard." />
      </div>
    );
  }

  if (isPersonalMode ? reportDataLoading : !organization || reportDataLoading) {
    return <DashboardSkeleton />;
  }

  const ticketsHref = isPersonalMode
    ? "/dashboard/tickets"
    : `/dashboard/organizations/${activeOrganization!.settings.slug}/tickets`;
  const requestsHref = isPersonalMode
    ? null
    : `/dashboard/organizations/${activeOrganization!.settings.slug}/requests`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          {isPersonalMode
            ? "Here's what's moving across your personal tickets."
            : `Here's what's moving across ${organization!.organizationName}.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statTiles.map((stat) => (
          <StatTileCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card
        title="Status breakdown"
        subtitle="How many tickets sit in each stage, as a pie and as a bar chart."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <StatusPieChart rows={statusRows} />
          <StatusBreakdownChart rows={statusRows} />
        </div>
      </Card>

      <Card
        title="Ticket activity over time"
        subtitle="Choose what to plot."
      >
        <div className="space-y-4">
          <TrendSeriesSelect
            value={trendSelection}
            onChange={setTrendSelection}
            tags={tags}
          />
          <TrendLineChart
            series={trendSeries}
            emptyMessage="Select at least one option above to plot it."
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Recent tickets"
          headerActions={
            <Link
              href={ticketsHref}
              className="text-sm text-accent-text hover:underline"
            >
              View all
            </Link>
          }
        >
          {recentTickets.length === 0 ? (
            <EmptyState subtitle="No tickets yet." />
          ) : (
            <ul className="-mx-6 -mb-5 divide-y divide-line">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-canvas"
                  >
                    <span className="w-16 shrink-0 font-mono text-xs text-ink-faint">
                      {ticket.referenceId}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {ticket.title}
                    </span>
                    <span
                      className="flex shrink-0 items-center gap-1.5 text-xs font-medium"
                      style={{ color: ticket.tag.color }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: ticket.tag.color }}
                      />
                      {ticket.tag.tagName}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!isPersonalMode && requestsHref && (
          <Card
            title="Recent requests"
            headerActions={
              <Link
                href={requestsHref}
                className="text-sm text-accent-text hover:underline"
              >
                View all
              </Link>
            }
          >
            {recentRequests.length === 0 ? (
              <EmptyState subtitle="No requests yet." />
            ) : (
              <ul className="-mx-6 -mb-5 divide-y divide-line">
                {recentRequests.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/dashboard/requests/${request.id}`}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-canvas"
                    >
                      <span className="w-16 shrink-0 font-mono text-xs text-ink-faint">
                        {request.referenceId}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-ink">
                        {request.title}
                      </span>
                      <span className="shrink-0">
                        <RequestStatusBadge status={request.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
