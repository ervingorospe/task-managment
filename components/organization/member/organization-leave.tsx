"use client";

import { useState } from "react";
import { DangerZoneCard, DangerZoneRow } from "@/components/ui/danger-zone-card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { useToast } from "@/providers/toast-provider";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

interface LeaveOrganizationSectionProps {
  organizationName: string;
}

export default function LeaveOrganizationSection({
  organizationName,
}: LeaveOrganizationSectionProps) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  function handleConfirm() {
    setConfirm(false);
    toast(`Left "${organizationName}"`, "error");
  }

  return (
    <DangerZoneCard>
      <DangerZoneRow
        title="Leave this organization"
        description="Permanently leave this organization."
        actionLabel="Leave organization"
        onAction={() => setConfirm(true)}
      />

      {confirm && (
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={handleConfirm}
          title={`Leave "${organizationName}"?`}
          confirmLabel="Leave organization"
          description="You will be immediately removed from the organization. To rejoin, you will need to ask your supervisor to add you again."
          danger={true}
        />
      )}
    </DangerZoneCard>
  );
}
