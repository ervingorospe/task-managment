import type { DueState } from "@/lib/helper/ticket-status";

export function DueChip({ state }: { state: Exclude<DueState, null> }) {
  const isOverdue = state === "overdue";
  return (
    <span
      className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isOverdue
          ? "bg-danger-subtle text-danger"
          : "bg-warning-subtle text-warning"
      }`}
    >
      {isOverdue ? "Overdue" : "Due today"}
    </span>
  );
}
