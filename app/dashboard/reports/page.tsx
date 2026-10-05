import type { Metadata } from "next";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import ReportsClient from "@/components/reports/reports-client";

export const metadata: Metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <Can
      anyOf={[PERMISSIONS.REPORT_VIEW_ALL, PERMISSIONS.REPORT_VIEW_OWN]}
      fallback={
        <EmptyState subtitle="You do not have permission to view reports." />
      }
    >
      <ReportsClient />
    </Can>
  );
}
