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
