"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth } from "@/providers/auth-provider";
import {
  fetchTicketNotifications,
  markNotificationsSeen as apiMarkNotificationsSeen,
} from "@/lib/api/activity-log";
import { API_BASE_URL } from "@/lib/api/client";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

// The SSE stream below (see activity-log.controller.ts's
// streamNotifications) is the primary delivery channel — this poll is
// just a safety net for the rare case a connection drops without
// EventSource's own browser-native reconnect kicking in (e.g. a proxy
// that strips SSE). Deliberately much longer than it needs to be for
// "normal" delivery, since the stream handles that.
const FALLBACK_POLL_INTERVAL_MS = 2 * 60 * 1000;

interface NotificationsContextValue {
  items: ActivityLogEntry[];
  unreadCount: number;
  /** Optimistically zeroes the badge, then tells the backend to move the
   * "seen" cursor to now — call this exactly when the bell opens (see
   * Dropdown's onOpen), not on every render. */
  markSeen: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    function load() {
      fetchTicketNotifications()
        .then((result) => {
          if (cancelled) return;
          setItems(result.items);
          setUnreadCount(result.unreadCount);
        })
        .catch((error) => {
          console.error("Failed to load notifications", error);
        });
    }

    load();

    // The stream only ever carries a "something changed" signal, never
    // the notification payload itself — reacting to it just re-runs the
    // same load() the initial fetch and the poll fallback already use, so
    // there's one single source of truth for what a notification is.
    const source = new EventSource(
      `${API_BASE_URL}/activity-log/notifications/stream`,
      { withCredentials: true },
    );
    source.addEventListener("notification", load);
    source.onerror = (event) => {
      // EventSource retries connecting on its own — this is just visibility
      // into that happening, not a fatal condition to handle here.
      console.error("Notification stream error", event);
    };

    const interval = setInterval(load, FALLBACK_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      source.close();
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  const markSeen = useCallback(() => {
    setUnreadCount(0);
    apiMarkNotificationsSeen().catch((error) => {
      console.error("Failed to mark notifications as seen", error);
    });
  }, []);

  return (
    <NotificationsContext.Provider value={{ items, unreadCount, markSeen }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider",
    );
  }
  return context;
}
