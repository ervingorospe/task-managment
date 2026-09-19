"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Ticket as TicketIcon } from "lucide-react";
import Card from "@/components/ui/card";
import { StatTileCard, type StatTile } from "@/components/ui/stat-tile-card";
import {
  filterTicketsByDateRange,
  getDueSummary,
  getStatusBreakdown,
  getTrendSeries,
  type DateRange,
  type TrendSelection,
} from "@/lib/helper/ticket-reports";
import { StatusBreakdownChart } from "./status-breakdown-chart";
import { StatusPieChart } from "./status-pie-chart";
import { TrendLineChart } from "./trend-line-chart";
import { DateRangeControl } from "./date-range-control";
import { TrendSeriesSelect } from "./trend-series-select";
import { MonthComparisonChart } from "./month-comparison-chart";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface TicketReportsProps {
  organization: OrganizationDetail;
}

export default function TicketReports({ organization }: TicketReportsProps) {
  const tickets = useMemo(() => organization.tickets ?? [], [organization]);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });
  const [trendSelection, setTrendSelection] = useState<TrendSelection>({
    created: true,
    dueDate: false,
    tagIds: [],
  });

  const rangedTickets = useMemo(
    () => filterTicketsByDateRange(tickets, dateRange),
    [tickets, dateRange],
  );

  const statusRows = useMemo(
    () => getStatusBreakdown(rangedTickets),
    [rangedTickets],
  );
  const dueSummary = useMemo(() => getDueSummary(tickets), [tickets]);
  const trendSeries = useMemo(
    () =>
      getTrendSeries(rangedTickets, organization.tags, {
        selection: trendSelection,
        range: dateRange,
      }),
    [rangedTickets, organization.tags, trendSelection, dateRange],
  );

  const statTiles: StatTile[] = [
    {
      label: "Total tickets",
      value: tickets.length,
      caption: "across every status",
      icon: TicketIcon,
      tint: "bg-accent-subtle",
      iconColor: "text-accent-text",
      valueColor: "text-ink",
      barColor: "bg-accent",
    },
    {
      label: "Overdue",
      value: dueSummary.overdue,
      caption: "past their due date",
      icon: AlertTriangle,
      tint: dueSummary.overdue > 0 ? "bg-danger-subtle" : "bg-canvas",
      iconColor: dueSummary.overdue > 0 ? "text-danger" : "text-ink-faint",
      valueColor: dueSummary.overdue > 0 ? "text-danger" : "text-ink",
      barColor: dueSummary.overdue > 0 ? "bg-danger" : "bg-line",
    },
    {
      label: "On time",
      value: dueSummary.onTime,
      caption: "on track to meet their due date",
      icon: CheckCircle2,
      tint: "bg-accent-subtle",
      iconColor: "text-accent-text",
      valueColor: "text-ink",
      barColor: "bg-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Ticket reports</h2>
        <p className="mt-1 text-sm text-ink-muted">
          An overview of ticket activity in {organization.organizationName}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statTiles.map((stat) => (
          <StatTileCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex justify-end">
        <DateRangeControl value={dateRange} onChange={setDateRange} />
      </div>

      <Card
        title="Status breakdown"
        subtitle="How many tickets sit in each stage — scoped to the date range above, when set."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <StatusPieChart rows={statusRows} />
          <StatusBreakdownChart rows={statusRows} />
        </div>
      </Card>

      <Card
        title="Ticket activity over time"
        subtitle="Choose what to plot, or narrow it with the date range above."
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

      <Card
        title="Compare two periods"
        subtitle="See how ticket creation compares month to month or year to year, by tag or overdue status."
      >
        <MonthComparisonChart tickets={tickets} tags={organization.tags} />
      </Card>
    </div>
  );
}
