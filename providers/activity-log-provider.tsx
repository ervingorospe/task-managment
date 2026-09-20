"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { activityLogSeed } from "@/lib/data/activity-log-seed";
import type { ActivityLogEntry } from "@/lib/types/activity/activity-log-entry.type";

interface ActivityLogContextValue {
  entries: ActivityLogEntry[];
  logActivity: (entry: Omit<ActivityLogEntry, "id" | "createdAt">) => void;
}

const ActivityLogContext = createContext<ActivityLogContextValue | null>(null);

export function ActivityLogProvider({ children }: PropsWithChildren) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>(activityLogSeed);

  function logActivity(entry: Omit<ActivityLogEntry, "id" | "createdAt">) {
    setEntries((prev) => [
      { ...entry, id: Date.now(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
    // TODO: POST /activity-log in the background.
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
