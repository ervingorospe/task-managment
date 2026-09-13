import clsx from "clsx";

export type Status = "todo" | "progress" | "done" | "blocked";

const statusLabel: Record<Status, string> = {
  todo: "To do",
  progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};

const statusDot: Record<Status, string> = {
  todo: "bg-status-todo",
  progress: "bg-status-progress",
  done: "bg-status-done",
  blocked: "bg-status-blocked",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-line px-2 py-0.5 text-xs text-ink">
      <span className={clsx("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {statusLabel[status]}
    </span>
  );
}
