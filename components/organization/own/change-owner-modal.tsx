"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import {
  changeOwnerSchema,
  type ChangeOwnerValues,
} from "@/lib/schemas/organization.schema";
import { requestOwnershipTransfer } from "@/lib/api/organizations";

interface ChangeOwnerModalProps {
  open: boolean;
  orgId: number;
  onClose: () => void;
  onSent: (email: string) => void;
}

export function ChangeOwnerModal({
  open,
  orgId,
  onClose,
  onSent,
}: ChangeOwnerModalProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangeOwnerValues>({
    resolver: zodResolver(changeOwnerSchema),
    defaultValues: { email: "" },
  });

  function handleClose() {
    reset();
    onClose();
  }

  async function submit(values: ChangeOwnerValues) {
    try {
      await requestOwnershipTransfer(orgId, values.email);
    } catch (error) {
      notifyApiError(toast, error, "Failed to send ownership transfer invite");
      return;
    }
    onSent(values.email);
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Change organization owner"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)}>Send invite</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="flex gap-3 rounded border border-line bg-canvas px-3 py-2.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          <p className="text-sm text-ink-muted">
            Are you sure you want to change ownership? This will send an invite
            to the new owner, who can accept or decline it. You&apos;ll remain
            the owner until they accept.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-ink">
            New owner&apos;s email <span className="text-danger">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="new-owner@company.com"
            maxLength={50}
            className="w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
          )}
        </div>
      </form>
    </Modal>
  );
}
