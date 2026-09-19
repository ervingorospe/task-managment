import type { AssigneeBreakdownRow } from "@/lib/helper/ticket-reports";

interface AssigneeBreakdownListProps {
  rows: AssigneeBreakdownRow[];
}

export function AssigneeBreakdownList({ rows }: AssigneeBreakdownListProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">No tickets assigned yet.</p>;
  }

  const maxCount = Math.max(...rows.map((r) => r.count));

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.memberId} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-sm text-ink">
            {row.name}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${(row.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-ink">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
