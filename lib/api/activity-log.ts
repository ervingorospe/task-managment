import { api } from "./client";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";
import type { RawActivityLogEntry, RawPage } from "./raw-types";

function adaptEntry(e: RawActivityLogEntry): ActivityLogEntry {
  return {
    id: e.id,
    orgId: e.orgId,
    module: e.module.toLowerCase() as ActivityLogEntry["module"],
    action: e.action,
    entityId: e.entityId,
    entityLabel: e.entityLabel,
    referenceId: e.referenceId ?? undefined,
    actorId: e.actorId,
    actorName: e.actorName,
    actorAvatar: e.actorAvatar,
    involvedUserIds: e.involvedUserIds ?? [],
    description: e.description,
    createdAt: e.createdAt,
  };
}

export async function fetchActivityLog(orgId: number): Promise<ActivityLogEntry[]> {
  const page = await api.get<RawPage<RawActivityLogEntry>>(
    `/activity-log?orgId=${orgId}&limit=100`,
  );
  return page.items.map(adaptEntry);
}

export async function fetchPersonalActivityLog(
  userId: number,
): Promise<ActivityLogEntry[]> {
  const page = await api.get<RawPage<RawActivityLogEntry>>(
    `/activity-log/personal?userId=${userId}&limit=100`,
  );
  return page.items.map(adaptEntry);
}

export async function postActivityLog(
  entry: Omit<ActivityLogEntry, "id" | "createdAt">,
): Promise<ActivityLogEntry> {
  const created = await api.post<RawActivityLogEntry>("/activity-log", {
    ...entry,
    module: entry.module.toUpperCase(),
  });
  return adaptEntry(created);
}
