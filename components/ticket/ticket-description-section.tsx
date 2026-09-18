"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AlignLeft, Pencil } from "lucide-react";

import { Button } from "@/components/ui/buttons/button";
import { MarkdownEditor } from "@/components/ui/form";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { PERMISSIONS } from "@/lib/data/permissions";
import { renderDescription } from "@/lib/helper/render-description";
import { SectionHeading } from "./section-heading";

interface TicketDescriptionSectionProps {
  description?: string;
}

export default function TicketDescriptionSection({
  description: initialDescription,
}: TicketDescriptionSectionProps) {
  const toast = useToast();
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const { control, handleSubmit, reset } = useForm<{ description: string }>({
    defaultValues: { description },
  });

  function startEdit() {
    reset({ description });
    setIsEditing(true);
  }

  function save(values: { description: string }) {
    setDescription(values.description);
    setIsEditing(false);
    toast("Description updated");
    // TODO: PATCH /tickets/:id { description: values.description }
  }

  const hasDescription = Boolean(description.trim());

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionHeading icon={AlignLeft}>Description</SectionHeading>

        {!isEditing && (
          <Can action={PERMISSIONS.TICKET_UPDATE}>
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center gap-1 text-xs font-medium text-accent-text hover:underline"
            >
              <Pencil size={12} />
              Edit
            </button>
          </Can>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <MarkdownEditor
            name="description"
            control={control}
            placeholder="What's going on? Supports markdown formatting."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit(save)}>
              Save
            </Button>
          </div>
        </div>
      ) : hasDescription ? (
        <div
          className="ticket-description"
          dangerouslySetInnerHTML={{ __html: renderDescription(description) }}
        />
      ) : (
        <p className="text-sm text-ink-faint">No description provided.</p>
      )}
    </section>
  );
}
