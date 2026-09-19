import type { TicketDetail } from "../types/ticket/ticket-detail.type";
import type { TagDetail } from "../types/organization/tag-detail.type";
import { getDueState } from "./ticket-status";

export interface DateRange {
  from: string | null; // YYYY-MM-DD
  to: string | null; // YYYY-MM-DD
}

const dayKey = (iso: string) => iso.slice(0, 10);

/** Tickets created within an inclusive [from, to] range. No-op unless both bounds are set. */
export function filterTicketsByDateRange(
  tickets: TicketDetail[],
  range: DateRange,
): TicketDetail[] {
  if (!range.from || !range.to) return tickets;
  return tickets.filter((t) => {
    const created = dayKey(t.createdAt);
    return created >= range.from! && created <= range.to!;
  });
}

export interface StatusBreakdownRow {
  tagId: number;
  tagName: string;
  color: string;
  count: number;
}

/** One row per tag that actually appears, ordered by count desc. */
export function getStatusBreakdown(
  tickets: TicketDetail[],
): StatusBreakdownRow[] {
  const byTag = new Map<number, StatusBreakdownRow>();

  for (const ticket of tickets) {
    const existing = byTag.get(ticket.tag.id);
    if (existing) {
      existing.count += 1;
    } else {
      byTag.set(ticket.tag.id, {
        tagId: ticket.tag.id,
        tagName: ticket.tag.tagName,
        color: ticket.tag.color,
        count: 1,
      });
    }
  }

  return Array.from(byTag.values()).sort((a, b) => b.count - a.count);
}

export interface DueSummary {
  total: number;
  overdue: number;
  onTime: number;
}

/** Overdue vs on-time, counted only among open (non-terminal) tickets. */
export function getDueSummary(tickets: TicketDetail[]): DueSummary {
  let overdue = 0;
  let onTime = 0;

  for (const ticket of tickets) {
    const state = getDueState(ticket);
    if (state === "overdue") {
      overdue += 1;
    } else if (ticket.dueDate) {
      onTime += 1;
    }
  }

  return { total: overdue + onTime, overdue, onTime };
}

export interface TrendPoint {
  x: number; // position along the shared domain (day index, or day-of-month)
  y: number;
  xLabel: string; // what to show on the axis / tooltip for this point
}

export interface TrendSeries {
  id: string;
  label: string;
  color: string;
  points: TrendPoint[];
}

export interface TrendSelection {
  created: boolean;
  dueDate: boolean;
  tagIds: number[];
}

const CREATED_COLOR = "#8B5CF6";
const DUE_DATE_COLOR = "#E2A03F";

function buildDayWindow(
  tickets: TicketDetail[],
  range: DateRange,
  days: number,
): string[] {
  if (range.from && range.to) {
    const out: string[] = [];
    const cursor = new Date(`${range.from}T00:00:00`);
    const end = new Date(`${range.to}T00:00:00`);
    while (cursor <= end) {
      out.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }

  if (tickets.length === 0) return [];

  // Trailing window anchored to the latest ticket's createdAt (not
  // wall-clock "today") so the trend stays populated regardless of how
  // long ago this mock data was generated.
  const latest = tickets.reduce(
    (max, t) => (t.createdAt > max ? t.createdAt : max),
    tickets[0].createdAt,
  );
  const anchor = new Date(dayKey(latest));

  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function formatAxisDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Builds the series for the ticket activity chart. Every checked option
 * becomes its own line, all sharing the same day buckets so they stay
 * comparable on one x-axis:
 * - "created": tickets created that day (by createdAt).
 * - "dueDate": tickets due that day (by dueDate).
 * - one line per selected tag, in fixed org-tag order (categorical color),
 *   counting tickets created that day with that tag.
 */
export function getTrendSeries(
  tickets: TicketDetail[],
  tags: TagDetail[],
  options: { selection: TrendSelection; range: DateRange; days?: number },
): TrendSeries[] {
  const { selection, range, days = 30 } = options;
  const window = buildDayWindow(tickets, range, days);
  if (window.length === 0) return [];

  const series: TrendSeries[] = [];

  if (selection.created) {
    const counts = new Map<string, number>();
    for (const t of tickets) {
      const key = dayKey(t.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    series.push({
      id: "created",
      label: "Created",
      color: CREATED_COLOR,
      points: window.map((date, i) => ({
        x: i,
        y: counts.get(date) ?? 0,
        xLabel: formatAxisDate(date),
      })),
    });
  }

  if (selection.dueDate) {
    const counts = new Map<string, number>();
    for (const t of tickets) {
      if (!t.dueDate) continue;
      counts.set(t.dueDate, (counts.get(t.dueDate) ?? 0) + 1);
    }
    series.push({
      id: "dueDate",
      label: "Due date",
      color: DUE_DATE_COLOR,
      points: window.map((date, i) => ({
        x: i,
        y: counts.get(date) ?? 0,
        xLabel: formatAxisDate(date),
      })),
    });
  }

  for (const tag of tags) {
    if (!selection.tagIds.includes(tag.id)) continue;

    const counts = new Map<string, number>();
    for (const t of tickets) {
      if (t.tag.id !== tag.id) continue;
      const key = dayKey(t.createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    series.push({
      id: `tag-${tag.id}`,
      label: tag.tagName,
      color: tag.color,
      points: window.map((date, i) => ({
        x: i,
        y: counts.get(date) ?? 0,
        xLabel: formatAxisDate(date),
      })),
    });
  }

  return series;
}

export interface MonthComparisonOptions {
  monthA: string; // "YYYY-MM"
  monthB: string; // "YYYY-MM"
  tagIds: number[]; // empty = all tags
  overdueOnly: boolean;
}

function daysInMonth(month: string): number {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon, 0).getDate();
}

function formatMonthLabel(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1, 1).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

const MONTH_COMPARISON_COLORS = ["#32CD32", "#3B82C4"];

/**
 * One series per selected month, bucketed by day-of-month (1..N) so two
 * different months can share the same x-axis. Each series only spans as
 * many days as that month actually has.
 */
export function getMonthComparisonSeries(
  tickets: TicketDetail[],
  options: MonthComparisonOptions,
): TrendSeries[] {
  const { monthA, monthB, tagIds, overdueOnly } = options;

  return [monthA, monthB].map((month, i) => {
    const total = daysInMonth(month);
    const counts = new Map<number, number>();

    for (const t of tickets) {
      if (dayKey(t.createdAt).slice(0, 7) !== month) continue;
      if (tagIds.length > 0 && !tagIds.includes(t.tag.id)) continue;
      if (overdueOnly && getDueState(t) !== "overdue") continue;

      const day = Number(t.createdAt.slice(8, 10));
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }

    const points: TrendPoint[] = [];
    for (let day = 1; day <= total; day++) {
      points.push({ x: day, y: counts.get(day) ?? 0, xLabel: `Day ${day}` });
    }

    return {
      id: month,
      label: formatMonthLabel(month),
      color: MONTH_COMPARISON_COLORS[i],
      points,
    };
  });
}
