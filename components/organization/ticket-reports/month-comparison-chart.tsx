"use client";

import { useMemo, useState } from "react";
import CheckboxBase from "@/components/ui/form/checkbox-base";
import {
  getMonthComparisonSeries,
  getYearComparisonSeries,
} from "@/lib/helper/ticket-reports";
import { TrendLineChart } from "./trend-line-chart";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface MonthComparisonChartProps {
  tickets: TicketDetail[];
  tags: TagDetail[];
}

type ComparisonMode = "month" | "year";

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

  const [mode, setMode] = useState<ComparisonMode>("month");
  const [monthA, setMonthA] = useState(() => shiftMonth(latestMonth, -1));
  const [monthB, setMonthB] = useState(latestMonth);
  const [yearA, setYearA] = useState(() =>
    String(Number(latestMonth.slice(0, 4)) - 1),
  );
  const [yearB, setYearB] = useState(latestMonth.slice(0, 4));
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);

  function toggleTag(id: number) {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const series = useMemo(() => {
    if (mode === "year") {
      return getYearComparisonSeries(tickets, {
        yearA,
        yearB,
        tagIds,
        overdueOnly,
      });
    }
    return getMonthComparisonSeries(tickets, {
      monthA,
      monthB,
      tagIds,
      overdueOnly,
    });
  }, [tickets, mode, monthA, monthB, yearA, yearB, tagIds, overdueOnly]);

  const selectedTagNames = tags
    .filter((t) => tagIds.includes(t.id))
    .map((t) => t.tagName);
  const filterSummary = [
    selectedTagNames.length > 0 ? selectedTagNames.join(", ") : "all tags",
    overdueOnly ? "overdue only" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <p className="hidden text-sm text-ink-muted print:block">
        Comparing:{" "}
        {mode === "year" ? `${yearA} vs ${yearB}` : `${monthA} vs ${monthB}`}{" "}
        ({filterSummary})
      </p>

      <div className="mb-3 inline-flex rounded border border-line p-0.5 print:hidden">
        {(["month", "year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            aria-pressed={mode === option}
            className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
              mode === option
                ? "bg-accent-subtle text-accent-text"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-4 print:hidden">
        {mode === "month" ? (
          <>
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
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Year A
              <input
                type="number"
                value={yearA}
                onChange={(e) => setYearA(e.target.value)}
                className="w-24 rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Year B
              <input
                type="number"
                value={yearB}
                onChange={(e) => setYearB(e.target.value)}
                className="w-24 rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
              />
            </label>
          </>
        )}

        <CheckboxBase
          checked={overdueOnly}
          onChange={() => setOverdueOnly((v) => !v)}
          label="Overdue only"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 print:hidden">
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
          emptyMessage={`No tickets created in ${
            mode === "year" ? "these years" : "these months"
          } yet.`}
        />
      </div>
    </div>
  );
}
