import type { ActivityLogEntry } from "../types/activity/activity-log-entry.type";

/**
 * activity.log.view.included: the viewer only sees entries they're listed
 * on. No lookup against tickets/members/etc. — the log is standalone, so
 * `involvedUserIds` is captured on the entry itself when it's written.
 */
export function isActivityEntryIncluded(
  entry: ActivityLogEntry,
  userId: number | undefined,
): boolean {
  if (!userId) return false;
  return entry.involvedUserIds.includes(userId);
}
