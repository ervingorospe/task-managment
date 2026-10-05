import type { Metadata } from "next";
import ActivityLogClient from "@/components/activity/activity-log-client";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Activity Log" };

export default function ActivityPage() {
  return (
    <Can
      anyOf={[
        PERMISSIONS.ACTIVITY_LOG_VIEW_ALL,
        PERMISSIONS.ACTIVITY_LOG_VIEW_INCLUDED,
      ]}
      fallback={
        <EmptyState subtitle="You do not have permission to view the activity log." />
      }
    >
      <ActivityLogClient />
    </Can>
  );
}
