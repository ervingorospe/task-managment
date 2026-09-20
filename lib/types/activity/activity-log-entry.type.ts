export type ActivityModule = "ticket" | "request" | "member" | "role" | "tag";

/**
 * Standalone log table — no foreign keys, no joins against tickets/members/
 * etc. at read time. Everything a row needs (who it's about, what to show)
 * is captured on the row itself when it's written, so the log still reads
 * correctly even if the ticket, request, or member it was about is later
 * changed or removed.
 */
export interface ActivityLogEntry {
  id: number;
  orgId: number;
  module: ActivityModule;
  /** Short verb-based key, e.g. "created", "status_changed", "commented". */
  action: string;
  entityId: number;
  entityLabel: string;
  /** Ticket/request reference id at the time of the action, e.g. "tckt-00001". Absent for member/role/tag entries. */
  referenceId?: string;
  actorId: number;
  actorName: string;
  actorAvatar?: string | null;
  /**
   * Every user this entry concerns — the actor plus, for ticket/request
   * entries, the client and assignees at the time of the action, or for
   * member entries, the affected member's own user id. Drives
   * activity.log.view.included without ever looking up another table.
   */
  involvedUserIds: number[];
  /** Human-readable summary, e.g. "changed status to In-Progress". */
  description: string;
  createdAt: string;
}
