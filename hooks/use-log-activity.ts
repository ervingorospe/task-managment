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
}

/** Curries `logActivity` with the current user and a fixed module, so call
 * sites only supply what's actually specific to the action being logged. */
export function useLogActivity(module: ActivityModule) {
  const { currentUser } = useAuth();
  const { logActivity } = useActivityLog();

  return useCallback(
    (params: LogActivityParams) => {
      if (!currentUser) return;
      logActivity({
        orgId: params.orgId,
        module,
        action: params.action,
        entityId: params.entityId,
        entityLabel: params.entityLabel,
        actorId: currentUser.id,
        actorName: `${currentUser.firstName} ${currentUser.lastName}`,
        actorAvatar: currentUser.avatar,
        description: params.description,
      });
    },
    [module, currentUser, logActivity],
  );
}
