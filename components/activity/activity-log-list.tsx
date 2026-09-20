import { memo } from "react";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { ACTIVITY_MODULE_META } from "@/lib/helper/activity-log";
import { formatDate, formatRelative } from "@/lib/helper/format-date";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

interface ActivityLogListProps {
  entries: ActivityLogEntry[];
  emptyTitle?: string;
  emptySubtitle?: string;
}

function ActivityLogListComponent({
  entries,
  emptyTitle = "No activity yet",
  emptySubtitle = "Actions taken across this organization will show up here.",
}: ActivityLogListProps) {
  if (entries.length === 0) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => {
        const meta = ACTIVITY_MODULE_META[entry.module];
        const Icon = meta.icon;

        return (
          <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
            >
              <Icon size={15} />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                <span className="font-medium">{entry.actorName}</span>{" "}
                {entry.description}
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {entry.referenceId && (
                  <span className="font-mono text-ink-muted">
                    {entry.referenceId}
                  </span>
                )}
                {entry.referenceId && " · "}
                {formatDate(entry.createdAt)} · {formatRelative(entry.createdAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Avatar
                firstName={entry.actorName.split(" ")[0] ?? "?"}
                lastName={entry.actorName.split(" ")[1]}
                src={entry.actorAvatar ?? undefined}
                size="sm"
              />
              <span
                className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
              >
                {meta.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export const ActivityLogList = memo(ActivityLogListComponent);
