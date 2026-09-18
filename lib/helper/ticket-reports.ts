import type { TicketDetail } from "../types/ticket/ticket-detail.type";
import { getDueState } from "./ticket-status";

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

export interface CreatedTrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

/**
 * Daily created-ticket counts for a trailing window. Anchored to the latest
 * ticket's createdAt (not wall-clock "today") so the trend stays populated
 * regardless of how long ago this mock data was generated.
 */
export function getCreatedTrend(
  tickets: TicketDetail[],
  days = 30,
): CreatedTrendPoint[] {
  if (tickets.length === 0) return [];

  const dayKey = (iso: string) => iso.slice(0, 10);

  const latest = tickets.reduce(
    (max, t) => (t.createdAt > max ? t.createdAt : max),
    tickets[0].createdAt,
  );
  const anchor = new Date(dayKey(latest));

  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const key = dayKey(ticket.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: CreatedTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return points;
}
