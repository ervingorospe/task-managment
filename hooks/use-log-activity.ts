"use client";

import { useCallback } from "react";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useAuth } from "@/providers/auth-provider";
import type { ActivityModule } from "@/lib/types/activity/activity-log-entry.type";

interface LogActivityParams {
  orgId: number;
  action: string;
  entityId: number;
  entityLabel: string;
  description: string;
  /** Ticket/request reference id at the time of the action, e.g. "tckt-00001". */
  referenceId?: string;
  /** Other users this entry concerns, besides the actor (who's always included). */
  involvedUserIds?: (number | null | undefined)[];
}

/** Curries `logActivity` with the current user and a fixed module, so call
 * sites only supply what's actually specific to the action being logged. */
export function useLogActivity(module: ActivityModule) {
  const { currentUser } = useAuth();
  const { logActivity } = useActivityLog();

  return useCallback(
    (params: LogActivityParams) => {
      if (!currentUser) return;

      const involvedUserIds = Array.from(
        new Set(
          [currentUser.id, ...(params.involvedUserIds ?? [])].filter(
            (id): id is number => typeof id === "number",
          ),
        ),
      );

      logActivity({
        orgId: params.orgId,
        module,
        action: params.action,
        entityId: params.entityId,
        entityLabel: params.entityLabel,
        referenceId: params.referenceId,
        actorId: currentUser.id,
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorAvatar: currentUser.avatar,
        involvedUserIds,
        description: params.description,
      });
    },
    [module, currentUser, logActivity],
  );
}
