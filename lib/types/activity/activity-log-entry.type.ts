export type ActivityModule = "ticket" | "request" | "member" | "role" | "tag";

export interface ActivityLogEntry {
  id: number;
  orgId: number;
  module: ActivityModule;
  /** Short verb-based key, e.g. "created", "status_changed", "commented". */
  action: string;
  entityId: number;
  entityLabel: string;
  actorId: number;
  actorName: string;
  actorAvatar?: string | null;
  /** Human-readable summary, e.g. "changed status to In-Progress". */
  description: string;
  createdAt: string;
}
