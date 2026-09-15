"use client";

import { useState } from "react";
import Card from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lazyNamed } from "@/lib/helper/lazy-named";

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
  const [confirm, setConfirm] = useState<boolean>(false);

  function handleConfirm() {
    setConfirm(false);
  }

  return (
    <Card
      title="Danger Zone"
      subtitle="Irreversible and access-affecting actions for this organization."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded border border-danger/30 bg-danger-subtle px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">
              Leave this organization
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Permanently leave this organization.
            </p>
          </div>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Leave organization
          </Button>
        </div>
      </div>
      {confirm && (
        <ConfirmDialog
          open={confirm !== null}
          onClose={() => setConfirm(false)}
          onConfirm={handleConfirm}
          title={`Leave "${organizationName}"?`}
          confirmLabel="Leave organization"
          description="You will be immediately removed from the organization. To rejoin, you will need to ask your supervisor to add you again."
          danger={true}
        />
      )}
    </Card>
  );
}
