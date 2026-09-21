import type { TicketRequestStatus } from "@/lib/types/ticket/ticket-request.type";

const styles: Record<TicketRequestStatus, string> = {
  pending: "bg-warning-subtle text-warning",
  approved: "bg-accent-subtle text-accent-text",
  rejected: "bg-danger-subtle text-danger",
  cancelled: "bg-canvas text-ink-faint",
};

const labels: Record<TicketRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export function RequestStatusBadge({
  status,
}: {
  status: TicketRequestStatus;
}) {
  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
