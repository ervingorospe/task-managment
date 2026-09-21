"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DangerZoneCard,
  DangerZoneRow,
} from "@/components/ui/danger-zone-card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useAuth } from "@/providers/auth-provider";
import {
  updateOrganizationActiveState,
  deleteOrganization,
} from "@/lib/api/organizations";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

interface DeactivateOrganizationSectionProps {
  orgId: number;
  organizationName: string;
  initialIsActive?: boolean;
}

type PendingAction = "deactivate" | "activate" | "delete" | null;

export default function DeactivateOrganizationSection({
  orgId,
  organizationName,
  initialIsActive = true,
}: DeactivateOrganizationSectionProps) {
  const toast = useToast();
  const router = useRouter();
  const { removeMembership, refreshCurrentUser } = useAuth();
  const [isActive, setIsActive] = useState(initialIsActive);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  async function handleConfirm() {
    if (pendingAction === "deactivate") {
      try {
        await updateOrganizationActiveState(orgId, false);
      } catch (error) {
        notifyApiError(toast, error, "Failed to deactivate organization");
        setPendingAction(null);
        return;
      }
      setIsActive(false);
      // DashboardLayout gates /dashboard, /reports, /activity, etc. on
      // activeOrganization.settings.isActive from the global auth context
      // — without this, that context still holds the pre-deactivation
      // value, so those pages keep rendering as if the org were active
      // even though it's now disabled server-side.
      await refreshCurrentUser();
    } else if (pendingAction === "activate") {
      try {
        await updateOrganizationActiveState(orgId, true);
      } catch (error) {
        notifyApiError(toast, error, "Failed to activate organization");
        setPendingAction(null);
        return;
      }
      setIsActive(true);
      toast(`"${organizationName}" activated`);
      await refreshCurrentUser();
    } else if (pendingAction === "delete") {
      try {
        await deleteOrganization(orgId);
      } catch (error) {
        notifyApiError(toast, error, "Failed to delete organization");
        setPendingAction(null);
        return;
      }
      removeMembership(orgId);
      router.push("/dashboard/my-organizations");
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
