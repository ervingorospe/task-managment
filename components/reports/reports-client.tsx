"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Download,
  Inbox,
  Ticket as TicketIcon,
} from "lucide-react";
import Card from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/buttons/button";
import { StatTileCard, type StatTile } from "@/components/ui/stat-tile-card";
import { StatusBreakdownChart } from "@/components/organization/ticket-reports/status-breakdown-chart";
import { StatusPieChart } from "@/components/organization/ticket-reports/status-pie-chart";
import { TrendSeriesSelect } from "@/components/organization/ticket-reports/trend-series-select";
import { TrendLineChart } from "@/components/organization/ticket-reports/trend-line-chart";
import { MonthComparisonChart } from "@/components/organization/ticket-reports/month-comparison-chart";
import { AssigneeBreakdownList } from "./assignee-breakdown-list";
import { OverdueTicketList } from "./overdue-ticket-list";
import { ReportsSkeleton } from "@/components/ui/skeletons";
import { useAuth } from "@/providers/auth-provider";
import { useActiveOrganizationDetail } from "@/hooks/use-active-organization-detail";
import { useOrgReportData } from "@/hooks/use-org-report-data";
import { usePersonalTicketData } from "@/hooks/use-personal-ticket-data";
import { getDefaultTags } from "@/lib/data/organizations";
import {
  getAssigneeBreakdown,
  getStatusBreakdown,
  getTrendSeries,
  type TrendSelection,
} from "@/lib/helper/ticket-reports";
import { getDueState, isDueThisWeek } from "@/lib/helper/ticket-status";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

export default function ReportsClient() {
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

  const overdueTickets = useMemo(
    () => visibleTickets.filter((t) => getDueState(t) === "overdue"),
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
        value: overdueTickets.length,
        caption: "past their due date",
        icon: AlertTriangle,
        tint: overdueTickets.length > 0 ? "bg-danger-subtle" : "bg-canvas",
        iconColor:
          overdueTickets.length > 0 ? "text-danger" : "text-ink-faint",
        valueColor: overdueTickets.length > 0 ? "text-danger" : "text-ink",
        barColor: overdueTickets.length > 0 ? "bg-danger" : "bg-line",
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
    overdueTickets.length,
    dueThisWeekCount,
    pendingRequestsCount,
    isPersonalMode,
  ]);

  const statusRows = useMemo(
    () => getStatusBreakdown(visibleTickets),
    [visibleTickets],
  );
  const assigneeRows = useMemo(
    () => getAssigneeBreakdown(visibleTickets),
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

  if (!isPersonalMode && !activeOrganization) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-ink">Reports</h1>
          <p className="text-sm text-ink-muted">
            Generate daily, monthly, quarterly, or yearly reports.
          </p>
        </div>
        <EmptyState subtitle="Join or create an organization to see its reports." />
      </div>
    );
  }

  if (isPersonalMode ? reportDataLoading : !organization || reportDataLoading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-ink">Reports</h1>
          <p className="text-sm text-ink-muted">
            {isPersonalMode
              ? "A closer look at activity across your personal tickets."
              : `A closer look at ticket activity in ${organization!.organizationName}.`}
          </p>
        </div>

        <Button
          variant="secondary"
          className="print:hidden"
          onClick={() => window.print()}
        >
          <Download size={15} className="mr-1.5" />
          Download PDF
        </Button>
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

      <Card title="Ticket activity over time" subtitle="Choose what to plot.">
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

      <Card
        title="Compare two periods"
        subtitle="See how ticket creation compares month to month or year to year, by tag or overdue status."
      >
        <MonthComparisonChart tickets={visibleTickets} tags={tags} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* No team in Personal mode, so no assignee breakdown to show. */}
        {!isPersonalMode && (
          <Card
            title="Tickets by assignee"
            subtitle="Workload distribution across the team."
          >
            <AssigneeBreakdownList rows={assigneeRows} />
          </Card>
        )}

        <Card
          title="Overdue tickets"
          subtitle="The tickets that need attention first."
        >
          <OverdueTicketList tickets={overdueTickets} />
        </Card>
      </div>
    </div>
  );
}
