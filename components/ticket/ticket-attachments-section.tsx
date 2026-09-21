"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Paperclip, Plus } from "lucide-react";

import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { formatFileSize } from "@/lib/helper/ticket-status";
import { uploadTicketAttachment } from "@/lib/api/tickets";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { SectionHeading } from "./section-heading";

interface TicketAttachmentsSectionProps {
  ticketId: number;
  attachments: TicketAttachment[];
}

export default function TicketAttachmentsSection({
  ticketId,
  attachments: initialAttachments,
}: TicketAttachmentsSectionProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const attachment = await uploadTicketAttachment(ticketId, file);
      setAttachments((prev) => [...prev, attachment]);
    } catch (error) {
      notifyApiError(toast, error, "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionHeading icon={Paperclip}>
          Attachments
          {attachments.length > 0 && (
            <span className="text-ink-faint">({attachments.length})</span>
          )}
        </SectionHeading>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 text-xs font-medium text-accent-text hover:underline disabled:opacity-50"
        >
          <Plus size={12} />
          {isUploading ? "Uploading…" : "Add file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {attachments.length === 0 ? (
        <p className="mt-2 text-sm text-ink-faint">No files attached.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {attachments.map((file) => (
            <li key={file.id} className="flex items-center gap-2 py-2.5">
              <Paperclip size={14} className="shrink-0 text-ink-faint" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-accent-text hover:underline"
              >
                {file.name}
              </a>
              <span className="shrink-0 text-xs text-ink-faint">
                {formatFileSize(file.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
