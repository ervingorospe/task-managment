"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DangerZoneCard, DangerZoneRow } from "@/components/ui/danger-zone-card";
import { lazyNamed } from "@/lib/helper/lazy-named";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";

const ConfirmDialog = lazyNamed(
  () => import("@/components/ui/confirm-dialog"),
  "ConfirmDialog",
);

type PendingAction = "sign-out-others" | "delete" | null;

export default function AccountDangerZoneSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const toast = useToast();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  function handleConfirm() {
    if (pendingAction === "sign-out-others") {
      toast("Signed out of all other sessions");
      // TODO: POST /users/me/sessions/revoke-others
    } else if (pendingAction === "delete") {
      toast("Account deleted", "error");
      // TODO: DELETE /users/me — soft delete server-side.
      logout();
      router.replace("/login");
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
    <DangerZoneCard subtitle="Irreversible and access-affecting actions for your account.">
      <DangerZoneRow
        variant="default"
        title="Sign out of all other sessions"
        description="Sign out everywhere except this device."
        actionLabel="Sign out others"
        onAction={() => setPendingAction("sign-out-others")}
      />

      <DangerZoneRow
        title="Delete my account"
        description="Permanently deletes your account. This cannot be reversed."
        actionLabel="Delete account"
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
        />
      )}
    </DangerZoneCard>
  );
}
