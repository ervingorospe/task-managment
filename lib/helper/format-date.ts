/** `timeZone` should be the active organization's IANA zone (settings.timezone)
 * so everyone in the org sees activity timestamps the same way, regardless of
 * their own browser/OS timezone. Falls back to the browser's zone if omitted. */
export function formatDateTime(date: string, timeZone?: string): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  });
}

export function formatDate(date: string, timeZone?: string): string {
  return new Date(date).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
}

/** Today's date as YYYY-MM-DD in the given timezone — what <input type="date">
 * needs for a min/cutoff value. Uses the organization's timezone (not the
 * browser's) so "today" means the same thing for everyone in the org. */
export function getTodayInTimeZone(timeZone?: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone });
}

/** e.g. "today", "3 days ago", "2 months ago" — for a livelier timeline. */
export function formatRelative(date: string): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
