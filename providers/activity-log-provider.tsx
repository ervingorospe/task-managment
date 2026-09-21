"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useAuth } from "@/providers/auth-provider";
import { fetchActivityLog, postActivityLog } from "@/lib/api/activity-log";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

interface ActivityLogContextValue {
  entries: ActivityLogEntry[];
  logActivity: (entry: Omit<ActivityLogEntry, "id" | "createdAt">) => void;
}

const ActivityLogContext = createContext<ActivityLogContextValue | null>(null);

export function ActivityLogProvider({ children }: PropsWithChildren) {
  const { activeOrganization } = useAuth();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);

  // Hydrate real history for whichever org is active. Entries for other
  // orgs (from earlier in the session) are left alone so switching back
  // to them doesn't need a refetch.
  useEffect(() => {
    let cancelled = false;
    if (!activeOrganization) return;

    fetchActivityLog(activeOrganization.id).then((fetched) => {
      if (cancelled) return;
      setEntries((prev) => [
        ...fetched,
        ...prev.filter(
          (e) =>
            e.orgId !== activeOrganization.id ||
            !fetched.some((f) => f.id === e.id),
        ),
      ]);
    });

    return () => {
      cancelled = true;
    };
  }, [activeOrganization]);

  function logActivity(entry: Omit<ActivityLogEntry, "id" | "createdAt">) {
    const optimistic: ActivityLogEntry = {
      ...entry,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [optimistic, ...prev]);

    postActivityLog(entry)
      .then((persisted) => {
        setEntries((prev) =>
          prev.map((e) => (e.id === optimistic.id ? persisted : e)),
        );
      })
      .catch(() => {
        // Logging failures aren't surfaced as a toast — losing an audit
        // entry shouldn't interrupt whatever action the user was actually
        // doing. It just quietly stays as the optimistic local-only entry.
      });
  }

  const value = useMemo(() => ({ entries, logActivity }), [entries]);

  return (
    <ActivityLogContext.Provider value={value}>
      {children}
    </ActivityLogContext.Provider>
  );
}

export function useActivityLog() {
  const context = useContext(ActivityLogContext);
  if (!context) {
    throw new Error("useActivityLog must be used within ActivityLogProvider");
  }
  return context;
}
