"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { RoleDetail } from "@/lib/types/organization/role-detail.type";
import Radio from "@/components/ui/form/radio";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

interface SetRoleModalProps {
  open: boolean;
  onClose: () => void;
  roles: RoleDetail[];
  currentRoleId: number | null;
  onConfirm: (roleId: number) => void;
}

export function SetRoleModal({
  open,
  onClose,
  roles,
  currentRoleId,
  onConfirm,
}: SetRoleModalProps) {
  const [selected, setSelected] = useState<number | null>(currentRoleId);

  useEffect(() => {
    setSelected(currentRoleId);
  }, [currentRoleId, open]);

  function handleConfirm() {
    if (!selected) return;
    onConfirm(selected);
    onClose();
  }

  return (
    <Can anyOf={[PERMISSIONS.MEMBER_INVITE, PERMISSIONS.MEMBER_UPDATE_ROLE]}>
      <Modal
        open={open}
        onClose={onClose}
        title="Set role"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!selected}>
              Confirm
            </Button>
          </>
        }
      >
        {roles.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No roles yet. Create one first.
          </p>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {roles.map((role) => (
              <Radio
                key={role.id}
                value={role.id}
                checked={selected === role.id}
                onCheckedChange={() => setSelected(role.id)}
                label={role.roleName}
                description={role.roleDesc}
              />
            ))}
          </div>
        )}
      </Modal>
    </Can>
  );
}
