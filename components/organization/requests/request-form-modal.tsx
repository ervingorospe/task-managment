"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/buttons/button";
import Input from "@/components/ui/form/input";
import { FileAttachmentInput, MarkdownEditor } from "@/components/ui/form";
import {
  ticketRequestFormSchema,
  type TicketRequestFormValues,
} from "@/lib/schemas/ticket-request.schema";

interface RequestFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TicketRequestFormValues) => void;
}

const emptyDefaults: TicketRequestFormValues = {
  title: "",
  description: "",
  attachments: [],
};

export function RequestFormModal({
  open,
  onClose,
  onSubmit,
}: RequestFormModalProps) {
  const { control, handleSubmit, reset } = useForm<TicketRequestFormValues>({
    resolver: zodResolver(ticketRequestFormSchema),
    defaultValues: emptyDefaults,
  });

  function submit(values: TicketRequestFormValues) {
    onSubmit(values);
    reset(emptyDefaults);
    onClose();
  }

  function handleClose() {
    reset(emptyDefaults);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New request"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)}>Submit request</Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input
          name="title"
          control={control}
          label="Title"
          placeholder="What do you need?"
        />

        <MarkdownEditor
          name="description"
          control={control}
          label="Description"
          optional
          placeholder="Any extra details that would help us understand the request."
        />

        <FileAttachmentInput name="attachments" control={control} />
      </form>
    </Modal>
  );
}
