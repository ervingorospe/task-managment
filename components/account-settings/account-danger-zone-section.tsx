"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DangerZoneCard, DangerZoneRow } from "@/components/ui/danger-zone-card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { deleteUserAccount } from "@/lib/api/users";
import { notifyApiError } from "@/lib/helper/api-error-toast";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

type PendingAction = "sign-out-others" | "delete" | null;

export default function AccountDangerZoneSection() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  // An account created only by accepting an invite can never delete
  // itself — see current-user.type.ts's doc comment.
  const canDelete = !currentUser?.createdViaInvite;

  async function handleConfirm() {
    if (pendingAction === "sign-out-others") {
      toast("Signed out of all other sessions");
      // TODO: POST /users/me/sessions/revoke-others
      setPendingAction(null);
      return;
    }

    if (pendingAction === "delete" && currentUser) {
      try {
        await deleteUserAccount(currentUser.id);
        await logout();
        router.replace("/login");
      } catch (error) {
        notifyApiError(toast, error, "Failed to delete account");
      }
    }
    setPendingAction(null);
  }

  const dialogCopy: Record<
    Exclude<PendingAction, null>,
    { title: string; confirmLabel: string; description: string }
  > = {
    "sign-out-others": {
      title: "Sign out of all other sessions?",
      confirmLabel: "Sign out others",
      description:
        "Every other browser or device signed into your account will be signed out. This device stays signed in.",
    },
    delete: {
      title: "Delete your account?",
      confirmLabel: "Delete account",
      description:
        "This action cannot be undone. You'll lose access to every organization you belong to, and your data will be permanently removed.",
    },
  };

  return (
    <DangerZoneCard
      title="Advanced"
      subtitle="Irreversible and access-affecting actions for your account."
    >
      <DangerZoneRow
        variant="default"
        title="Sign out of all other sessions"
        description="Sign out everywhere except this device."
        actionLabel="Sign out others"
        onAction={() => setPendingAction("sign-out-others")}
      />

      {canDelete && (
        <DangerZoneRow
          title="Delete my account"
          description="Permanently deletes your account. This cannot be reversed."
          actionLabel="Delete account"
          onAction={() => setPendingAction("delete")}
        />
      )}

      {pendingAction && (
        <ConfirmDialog
          open={pendingAction !== null}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirm}
          title={dialogCopy[pendingAction].title}
          confirmLabel={dialogCopy[pendingAction].confirmLabel}
          description={dialogCopy[pendingAction].description}
        />
      )}
    </DangerZoneCard>
  );
}
