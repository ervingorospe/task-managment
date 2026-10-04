"use client";

import Link from "next/link";
import { Bell, Ticket } from "lucide-react";
import Dropdown from "@/components/ui/dropdown";
import Avatar from "@/components/ui/avatar";
import EmptyState from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/helper/format-date";
import { useNotifications } from "@/providers/notifications-provider";
import { useDropdown } from "@/providers/dropdown-context.provider";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

function NotificationRow({ entry }: { entry: ActivityLogEntry }) {
  // The dropdown doesn't unmount on a client-side route change, so a plain
  // <Link> would leave it open after navigating to the ticket — close it
  // explicitly, same as Dropdown.DropdownItem does internally.
  const { close } = useDropdown();

  return (
    <Link
      href={`/dashboard/tickets/${entry.entityId}`}
      onClick={close}
      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-canvas"
    >
      <Avatar
        firstName={entry.actorName.split(" ")[0]}
        lastName={entry.actorName.split(" ")[1]}
        src={entry.actorAvatar ?? undefined}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">
          <span className="font-medium">{entry.actorName}</span>{" "}
          {entry.description}
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
          <Ticket size={11} />
          {entry.referenceId && (
            <span className="font-mono text-ink-muted">
              {entry.referenceId}
            </span>
          )}
          {entry.referenceId && " · "}
          {formatRelative(entry.createdAt)}
        </p>
      </div>
    </Link>
  );
}

export function NotificationBell() {
  const { items, unreadCount, markSeen } = useNotifications();

  return (
    <Dropdown
      side="bottom"
      align="end"
      onOpen={markSeen}
      trigger={
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-black/5 hover:text-ink">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white"
              aria-label={`${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </span>
      }
    >
      <div className="border-b border-line px-3 py-2">
        <p className="text-sm font-medium text-ink">Ticket notifications</p>
      </div>

      <div className="max-h-96 w-80 overflow-y-auto">
        {items.length === 0 ? (
          <div className="px-3 py-6">
            <EmptyState
              title="No notifications yet"
              subtitle="Ticket activity you're involved in will show up here."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((entry) => (
              <li key={entry.id}>
                <NotificationRow entry={entry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dropdown>
  );
}
