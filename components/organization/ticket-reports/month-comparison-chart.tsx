"use client";

import { useMemo, useState } from "react";
import CheckboxBase from "@/components/ui/form/checkbox-base";
import { getMonthComparisonSeries } from "@/lib/helper/ticket-reports";
import { TrendLineChart } from "./trend-line-chart";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface MonthComparisonChartProps {
  tickets: TicketDetail[];
  tags: TagDetail[];
}

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const d = new Date(year, mon - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthComparisonChart({
  tickets,
  tags,
}: MonthComparisonChartProps) {
  const latestMonth = useMemo(() => {
    if (tickets.length === 0) return new Date().toISOString().slice(0, 7);
    const latest = tickets.reduce(
      (max, t) => (t.createdAt > max ? t.createdAt : max),
      tickets[0].createdAt,
    );
    return latest.slice(0, 7);
  }, [tickets]);

  const [monthA, setMonthA] = useState(() => shiftMonth(latestMonth, -1));
  const [monthB, setMonthB] = useState(latestMonth);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const series = useMemo(
    () =>
      getMonthComparisonSeries(tickets, { monthA, monthB, tagIds, overdueOnly }),
    [tickets, monthA, monthB, tagIds, overdueOnly],
  );

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Month A
          <input
            type="month"
            value={monthA}
            onChange={(e) => setMonthA(e.target.value)}
            className="rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          Month B
          <input
            type="month"
            value={monthB}
            onChange={(e) => setMonthB(e.target.value)}
            className="rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
          />
        </label>

        <CheckboxBase
          checked={overdueOnly}
          onChange={() => setOverdueOnly((v) => !v)}
          label="Overdue only"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {tags.map((tag) => (
          <CheckboxBase
            key={tag.id}
            checked={tagIds.includes(tag.id)}
            onChange={() => toggleTag(tag.id)}
            label={
              <span className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.tagName}
              </span>
            }
          />
        ))}
      </div>

      <div className="mt-4">
        <TrendLineChart
          series={series}
          emptyMessage="No tickets created in these months yet."
        />
      </div>
    </div>
  );
}
