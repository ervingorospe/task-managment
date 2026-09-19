import Link from "next/link";
import EmptyState from "@/components/ui/empty-state";
import { formatDueDate } from "@/lib/helper/ticket-status";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";

interface OverdueTicketListProps {
  tickets: TicketDetail[];
  limit?: number;
}

export function OverdueTicketList({
  tickets,
  limit = 8,
}: OverdueTicketListProps) {
  if (tickets.length === 0) {
    return <EmptyState subtitle="Nothing overdue — everything's on track." />;
  }

  // Oldest due date first — the ones that have been overdue longest need
  // attention first.
  const sorted = [...tickets].sort((a, b) =>
    (a.dueDate ?? "").localeCompare(b.dueDate ?? ""),
  );
  const visible = sorted.slice(0, limit);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div>
      <ul className="divide-y divide-line">
        {visible.map((ticket) => (
          <li key={ticket.id}>
            <Link
              href={`/dashboard/tickets/${ticket.id}`}
              className="flex items-center gap-3 py-2.5 hover:bg-canvas"
            >
              <span className="w-16 shrink-0 font-mono text-xs text-ink-faint">
                {ticket.referenceId}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink">
                {ticket.title}
              </span>
              <span
                className="flex shrink-0 items-center gap-1.5 text-xs font-medium"
                style={{ color: ticket.tag.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: ticket.tag.color }}
                />
                {ticket.tag.tagName}
              </span>
              <span className="shrink-0 rounded-sm bg-danger-subtle px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-danger uppercase">
                Due {formatDueDate(ticket.dueDate)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <p className="mt-2 text-xs text-ink-faint">
          +{hiddenCount} more overdue ticket{hiddenCount > 1 ? "s" : ""}.
        </p>
      )}
    </div>
  );
}
