"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import Select from "@/components/ui/form/select";
import { MarkdownEditor } from "@/components/ui/form";
import {
  personalTicketFormSchema,
  type PersonalTicketFormValues,
} from "@/lib/schemas/ticket.schema";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { localToday } from "@/lib/helper/ticket-status";

interface PersonalTicketFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: PersonalTicketFormValues) => void;
  /** The fixed global tag set — a personal ticket has no org tags. */
  tagOptions: TagDetail[];
}

function emptyDefaults(defaultTagId: string): PersonalTicketFormValues {
  return {
    title: "",
    description: "",
    tagId: defaultTagId,
    dueDate: "",
  };
}

/** Same modal chrome as TicketFormModal, minus everything org-specific
 * (organization/client/assignee pickers) — just title, description,
 * status (from the fixed global tag set), and due date. */
export default function PersonalTicketFormModal({
  open,
  onClose,
  onSubmit,
  tagOptions,
}: PersonalTicketFormModalProps) {
  const defaultTagId = String(
    tagOptions.find((t) => t.tagName === "To Do")?.id ??
      tagOptions[0]?.id ??
      "",
  );

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<PersonalTicketFormValues>({
    resolver: zodResolver(personalTicketFormSchema),
    defaultValues: emptyDefaults(defaultTagId),
  });

  useEffect(() => {
    if (open) reset(emptyDefaults(defaultTagId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function submit(values: PersonalTicketFormValues) {
    onSubmit(values);
    reset(emptyDefaults(defaultTagId));
    onClose();
  }

  function handleClose() {
    reset(emptyDefaults(defaultTagId));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create ticket"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)}>Create ticket</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input
          name="title"
          control={control}
          label="Title"
          placeholder="e.g. Renew passport"
        />

        <MarkdownEditor
          name="description"
          control={control}
          label="Description"
          optional
          placeholder="What's going on? Supports markdown formatting."
        />

        <Select
          name="tagId"
          control={control}
          label="Status"
          options={tagOptions.map((t) => ({
            value: String(t.id),
            label: t.tagName,
          }))}
        />

        <div className="w-full">
          <Input
            name="dueDate"
            control={control}
            type="date"
            label="Due date"
            optional
            min={localToday()}
          />
        </div>
      </form>
    </Modal>
  );
}
