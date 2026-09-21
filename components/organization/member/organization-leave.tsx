"use client";

import { useState } from "react";
import { DangerZoneCard, DangerZoneRow } from "@/components/ui/danger-zone-card";
import { Button } from "@/components/ui/buttons/button";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { useToast } from "@/providers/toast-provider";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

function useLeaveConfirm(organizationName: string) {
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);

  function handleConfirm() {
    setConfirm(false);
    toast(`Left "${organizationName}"`, "error");
  }

  const dialog = confirm && (
    <ConfirmDialog
      open={confirm}
      onClose={() => setConfirm(false)}
      onConfirm={handleConfirm}
      title={`Leave "${organizationName}"?`}
      confirmLabel="Leave organization"
      description="You will be immediately removed from the organization. To rejoin, you will need to ask your supervisor to add you again."
      danger={true}
    />
  );

  return { openConfirm: () => setConfirm(true), dialog };
}

interface LeaveOrganizationSectionProps {
  organizationName: string;
}

export default function LeaveOrganizationSection({
  organizationName,
}: LeaveOrganizationSectionProps) {
  const { openConfirm, dialog } = useLeaveConfirm(organizationName);

  return (
    <DangerZoneCard>
      <DangerZoneRow
        title="Leave this organization"
        description="Permanently leave this organization."
        actionLabel="Leave organization"
        onAction={openConfirm}
      />

      {dialog}
    </DangerZoneCard>
  );
}

/** Plain-button variant — used on OrganizationDisabledState, where the
 * full DangerZoneCard treatment doesn't fit; just a button under the
 * "organization disabled" message. */
export function LeaveOrganizationButton({
  organizationName,
}: LeaveOrganizationSectionProps) {
  const { openConfirm, dialog } = useLeaveConfirm(organizationName);

  return (
    <>
      <Button variant="danger" onClick={openConfirm}>
        Leave Organization
      </Button>

      {dialog}
    </>
  );
}
