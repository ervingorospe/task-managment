"use client";

import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/api/client";

type RealtimeResource = "TICKET" | "REQUEST" | "PROJECT";

/**
 * Live "something changed" push for one org's (or, with orgId null, the
 * current user's personal) ticket/request/project list — mirrors
 * NotificationsProvider's SSE pattern, but scoped per list instead of
 * app-wide, so the connection only exists while that list is mounted.
 * The stream never carries the changed row itself (see the backend's
 * RealtimeEventsService) — onChange just re-runs whatever fetch the
 * caller already uses for its first load, same "one source of truth"
 * rule the notification bell follows.
 */
export function useResourceEvents(
  orgId: number | null,
  resource: RealtimeResource,
  onChange: () => void,
) {
  useEffect(() => {
    const path =
      orgId != null
        ? `/activity-log/organizations/${orgId}/stream`
        : `/activity-log/personal/stream`;
    const source = new EventSource(`${API_BASE_URL}${path}`, {
      withCredentials: true,
    });

    source.addEventListener(resource, onChange);
    source.onerror = (event) => {
      // EventSource retries connecting on its own — this is just
      // visibility into that happening, not a fatal condition to handle
      // here.
      console.error("Resource stream error", event);
    };

    return () => {
      source.close();
    };
  }, [orgId, resource, onChange]);
}
