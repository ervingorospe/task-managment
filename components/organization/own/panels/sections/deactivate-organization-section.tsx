"use client";

import { useState } from "react";
import { DangerZoneCard, DangerZoneRow } from "@/components/ui/danger-zone-card";
import { lazyNamed } from "@/lib/helper/lazy-named";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

interface DeactivateOrganizationSectionProps {
  organizationName: string;
  initialIsActive?: boolean;
}

type PendingAction = "deactivate" | "activate" | "delete" | null;

export default function DeactivateOrganizationSection({
  organizationName,
  initialIsActive = true,
}: DeactivateOrganizationSectionProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  function handleConfirm() {
    if (pendingAction === "deactivate") {
      setIsActive(false);
      // TODO: PATCH /organizations/:id { isActive: false }
    } else if (pendingAction === "activate") {
      setIsActive(true);
      // TODO: PATCH /organizations/:id { isActive: true }
    } else if (pendingAction === "delete") {
      // TODO: DELETE /organizations/:id — soft delete server-side.
    }
    setPendingAction(null);
  }

  const dialogCopy: Record<
    Exclude<PendingAction, null>,
    { title: string; confirmLabel: string; description: string }
  > = {
    deactivate: {
      title: `Deactivate "${organizationName}"?`,
      confirmLabel: "Deactivate organization",
      description:
        "This will immediately revoke access for all members. Tickets, projects, and settings are preserved, and you can reactivate at any time from this page.",
    },
    activate: {
      title: `Activate "${organizationName}"?`,
      confirmLabel: "Activate organization",
      description:
        "Members will regain access to this organization immediately.",
    },
    delete: {
      title: `Delete "${organizationName}"?`,
      confirmLabel: "Delete organization",
      description:
        "This action cannot be undone. You and all members will permanently lose access to this organization, its tickets, projects, and settings.",
    },
  };

  return (
    <DangerZoneCard>
      <DangerZoneRow
        variant="default"
        title={
          isActive
            ? "Deactivate this organization"
            : "Activate this organization"
        }
        description={
          isActive
            ? "Members will lose access. You can reactivate at any time."
            : "This organization is currently deactivated. Members have no access."
        }
        actionLabel={isActive ? "Deactivate" : "Activate"}
        onAction={() => setPendingAction(isActive ? "deactivate" : "activate")}
      />

      <DangerZoneRow
        title="Delete this organization"
        description="Permanently removes this organization. This cannot be reversed."
        actionLabel="Delete organization"
        onAction={() => setPendingAction("delete")}
      />

      {pendingAction && (
        <ConfirmDialog
          open={pendingAction !== null}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirm}
          title={dialogCopy[pendingAction].title}
          confirmLabel={dialogCopy[pendingAction].confirmLabel}
          description={dialogCopy[pendingAction].description}
          danger={pendingAction !== "activate"}
        />
      )}
    </DangerZoneCard>
  );
}
