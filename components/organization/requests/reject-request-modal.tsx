"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Textarea from "@/components/ui/form/textarea";
import {
  rejectRequestSchema,
  type RejectRequestValues,
} from "@/lib/schemas/ticket-request-reject.schema";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";

interface RejectRequestModalProps {
  request: TicketRequest | null;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
}

const emptyDefaults: RejectRequestValues = { remarks: "" };

export function RejectRequestModal({
  request,
  onClose,
  onConfirm,
}: RejectRequestModalProps) {
  const { control, handleSubmit, reset } = useForm<RejectRequestValues>({
    resolver: zodResolver(rejectRequestSchema),
    defaultValues: emptyDefaults,
  });

  // Reused across different requests — clear the field each time a new one opens.
  useEffect(() => {
    if (request) reset(emptyDefaults);
  }, [request, reset]);

  function submit(values: RejectRequestValues) {
    onConfirm(values.remarks);
    onClose();
  }

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title="Reject request"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit(submit)}>
            Reject request
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />

        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-sm text-ink-muted">
            Are you sure you want to reject{" "}
            <span className="font-medium text-ink">
              &ldquo;{request?.title}&rdquo;
            </span>
            ? This can&apos;t be undone.
          </p>

          <Textarea
            name="remarks"
            control={control}
            label="Reason for rejection"
            placeholder="Let the client know why this request is being rejected."
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
