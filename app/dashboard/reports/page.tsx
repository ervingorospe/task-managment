import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import EmptyState from "@/components/ui/empty-state";
import ReportsClient from "@/components/reports/reports-client";

export default function ReportsPage() {
  return (
    <Can
      action={PERMISSIONS.REPORT_VIEW}
      fallback={
        <EmptyState subtitle="You do not have permission to view reports." />
      }
    >
      <ReportsClient />
    </Can>
  );
}
