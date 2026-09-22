import type { TicketDetail } from "../types/ticket/ticket-detail.type";

const TERMINAL_TAGS = ["Done", "Cancelled"];

export type DueState = "overdue" | "due-today" | null;

/** "Today" as the viewer's local calendar date, not UTC — `toISOString()`
 * reports the UTC date, which is a different calendar day from local
 * "today" for part of every 24h cycle in any timezone ahead of or behind
 * UTC (e.g. it's still "yesterday" in UTC for the first several hours of
 * each local day in UTC+ zones), which silently hid genuinely overdue
 * tickets from every "overdue"/"due this week" count. */
export function localToday(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** A due date is a plain calendar date, not an instant — a ticket "due
 * Sep 21" should read as Sep 21 for every viewer, not shift a day depending
 * on their timezone. Formatting off the raw date-prefix (anchored to UTC on
 * both ends) keeps that true regardless of what time-of-day component the
 * stored value carries or what timezone the viewer is in. */
export function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", timeZone: "UTC" },
  );
}

export function getDueState(
  ticket: Pick<TicketDetail, "dueDate" | "tag">,
): DueState {
  if (!ticket.dueDate) return null;
  if (TERMINAL_TAGS.includes(ticket.tag.tagName)) return null;

  const today = localToday();
  const dueDay = ticket.dueDate.slice(0, 10);
  if (dueDay < today) return "overdue";
  if (dueDay === today) return "due-today";
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isDueThisWeek(
  ticket: Pick<TicketDetail, "dueDate" | "tag">,
): boolean {
  if (!ticket.dueDate) return false;
  if (getDueState(ticket) === "overdue") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const due = new Date(`${ticket.dueDate.slice(0, 10)}T00:00:00`);
  return due >= today && due <= in7Days;
}
