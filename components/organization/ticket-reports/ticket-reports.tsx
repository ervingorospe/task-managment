"use client";

import { useMemo } from "react";
import Card from "@/components/ui/card";
import {
  getCreatedTrend,
  getDueSummary,
  getStatusBreakdown,
} from "@/lib/helper/ticket-reports";
import { StatusBreakdownChart } from "./status-breakdown-chart";
import { CreatedTrendChart } from "./created-trend-chart";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";

interface TicketReportsProps {
  organization: OrganizationDetail;
}

export default function TicketReports({ organization }: TicketReportsProps) {
  const tickets = useMemo(() => organization.tickets ?? [], [organization]);

  const statusRows = useMemo(() => getStatusBreakdown(tickets), [tickets]);
  const dueSummary = useMemo(() => getDueSummary(tickets), [tickets]);
  const trendPoints = useMemo(() => getCreatedTrend(tickets, 30), [tickets]);

  const stats = [
    { label: "Total tickets", value: tickets.length },
    { label: "Overdue", value: dueSummary.overdue, flagged: true },
    { label: "On time", value: dueSummary.onTime },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink">Ticket reports</h2>
        <p className="mt-1 text-sm text-ink-muted">
          An overview of ticket activity in {organization.organizationName}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded border border-line bg-line">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface p-4">
            <p className="text-sm text-ink-muted">{stat.label}</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                stat.flagged && stat.value > 0 ? "text-danger" : "text-ink"
              }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Card
        title="Status breakdown"
        subtitle="How many open tickets sit in each stage."
      >
        <StatusBreakdownChart rows={statusRows} />
      </Card>

      <Card
        title="Tickets created over time"
        subtitle="Daily ticket volume over the last 30 days."
      >
        <CreatedTrendChart points={trendPoints} />
      </Card>
    </div>
  );
}
