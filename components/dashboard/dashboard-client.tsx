"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Inbox, Ticket as TicketIcon } from "lucide-react";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { StatTileCard, type StatTile } from "@/components/ui/stat-tile-card";
import { TrendSeriesSelect } from "@/components/organization/ticket-reports/trend-series-select";
import { TrendLineChart } from "@/components/organization/ticket-reports/trend-line-chart";
import { RequestStatusBadge } from "@/components/organization/requests/request-status-badge";
import { useAuth, usePermission } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { PERMISSIONS } from "@/lib/data/permissions";
import {
  getStatusBreakdown,
  getTrendSeries,
  type TrendSelection,
} from "@/lib/helper/ticket-reports";
import { getDueState, isDueThisWeek } from "@/lib/helper/ticket-status";
import { isTicketIncluded } from "@/lib/helper/ticket-access";

export default function DashboardClient() {
  const { currentUser, activeOrganization } = useAuth();
  const canViewAll = usePermission(PERMISSIONS.TICKET_VIEW_ALL);
  const organization = useActiveOrganizationDetail();

  const [trendSelection, setTrendSelection] = useState<TrendSelection>({
    created: true,
    dueDate: false,
    tagIds: [],
  });

  if (!activeOrganization) {
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

  if (!organization) return null;

  const currentMember = organization.members.find(
    (m) => m.user?.id === currentUser?.id,
  );

  const visibleTickets = canViewAll
    ? organization.tickets
    : organization.tickets.filter((t) => isTicketIncluded(t, currentUser?.id));

  const visibleRequests = canViewAll
    ? organization.ticketRequests
    : organization.ticketRequests.filter(
        (r) => r.client.id === currentMember?.id,
      );

  const overdueCount = visibleTickets.filter(
    (t) => getDueState(t) === "overdue",
  ).length;
  const dueThisWeekCount = visibleTickets.filter(isDueThisWeek).length;
  const pendingRequestsCount = visibleRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const statTiles: StatTile[] = [
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
    {
      label: "Pending requests",
      value: pendingRequestsCount,
      caption: "awaiting a decision",
      icon: Inbox,
      tint: pendingRequestsCount > 0 ? "bg-warning-subtle" : "bg-canvas",
      iconColor: pendingRequestsCount > 0 ? "text-warning" : "text-ink-faint",
      valueColor: pendingRequestsCount > 0 ? "text-warning" : "text-ink",
      barColor: pendingRequestsCount > 0 ? "bg-warning" : "bg-line",
    },
  ];

  const statusRows = getStatusBreakdown(visibleTickets);
  const trendSeries = getTrendSeries(visibleTickets, organization.tags, {
    selection: trendSelection,
    range: { from: null, to: null },
  });

  const recentTickets = [...visibleTickets]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 5);

  const recentRequests = [...visibleRequests]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  const slug = activeOrganization.settings.slug;
  const ticketsHref = `/dashboard/organizations/${slug}/tickets`;
  const requestsHref = `/dashboard/organizations/${slug}/requests`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          Here&apos;s what&apos;s moving across {organization.organizationName}
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statTiles.map((stat) => (
          <StatTileCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card
        title="Status breakdown"
        subtitle="How many tickets sit in each stage."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {statusRows.map((row) => (
            <div
              key={row.tagId}
              className="rounded-lg border border-line bg-surface p-3"
            >
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
                <span className="truncate">{row.tagName}</span>
              </span>
              <p className="mt-1 text-xl font-semibold text-ink">
                {row.count}
              </p>
            </div>
          ))}
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
            tags={organization.tags}
          />
          <TrendLineChart
            series={trendSeries}
            emptyMessage="Select at least one option above to plot it."
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-medium text-ink">Recent tickets</h2>
            <Link
              href={ticketsHref}
              className="text-sm text-accent-text hover:underline"
            >
              View all
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <EmptyState subtitle="No tickets yet." />
          ) : (
            <ul className="divide-y divide-line">
              {recentTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/dashboard/tickets/${ticket.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
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
        </div>

        <div className="rounded border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-medium text-ink">Recent requests</h2>
            <Link
              href={requestsHref}
              className="text-sm text-accent-text hover:underline"
            >
              View all
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <EmptyState subtitle="No requests yet." />
          ) : (
            <ul className="divide-y divide-line">
              {recentRequests.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/dashboard/requests/${request.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-canvas"
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
        </div>
      </div>
    </div>
  );
}
