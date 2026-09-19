import type { TicketDetail } from "../types/ticket/ticket-detail.type";

const TERMINAL_TAGS = ["Done", "Cancelled"];

export type DueState = "overdue" | "due-today" | null;

export function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getDueState(
  ticket: Pick<TicketDetail, "dueDate" | "tag">,
): DueState {
  if (!ticket.dueDate) return null;
  if (TERMINAL_TAGS.includes(ticket.tag.tagName)) return null;

  const today = new Date().toISOString().slice(0, 10);
  if (ticket.dueDate < today) return "overdue";
  if (ticket.dueDate === today) return "due-today";
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

  const due = new Date(`${ticket.dueDate}T00:00:00`);
  return due >= today && due <= in7Days;
}
