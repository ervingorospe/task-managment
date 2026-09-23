"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Paperclip, Plus, X } from "lucide-react";

import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { useLogActivity } from "@/hooks/use-log-activity";
import { formatFileSize } from "@/lib/helper/ticket-status";
import { uploadTicketAttachment, removeTicketAttachment } from "@/lib/api/tickets";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { SectionHeading } from "./section-heading";

interface TicketAttachmentsSectionProps {
  ticketId: number;
  ticketTitle: string;
  referenceId: string;
  attachments: TicketAttachment[];
  client: MemberDetail | null;
  assignees: MemberDetail[];
  /** Null for a personal (org-less) ticket. */
  organization: OrganizationDetail | null;
}

export default function TicketAttachmentsSection({
  ticketId,
  ticketTitle,
  referenceId,
  attachments: initialAttachments,
  client,
  assignees,
  organization,
}: TicketAttachmentsSectionProps) {
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");
  const activityInvolvedUserIds = [
    client?.user?.id,
    ...assignees.map((a) => a.user?.id),
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentToRemove, setAttachmentToRemove] =
    useState<TicketAttachment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const attachment = await uploadTicketAttachment(ticketId, file);
      setAttachments((prev) => [...prev, attachment]);
      logTicketActivity({
        orgId: organization?.id,
        action: "attachment_added",
        entityId: ticketId,
        entityLabel: ticketTitle,
        referenceId,
        involvedUserIds: activityInvolvedUserIds,
        description: `attached "${attachment.name}" to "${ticketTitle}"`,
      });
    } catch (error) {
      notifyApiError(toast, error, "Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveAttachment() {
    if (!attachmentToRemove) return;
    const target = attachmentToRemove;
    setAttachmentToRemove(null);

    setIsRemoving(true);
    try {
      await removeTicketAttachment(ticketId, target.id);
      setAttachments((prev) => prev.filter((a) => a.id !== target.id));
      logTicketActivity({
        orgId: organization?.id,
        action: "attachment_removed",
        entityId: ticketId,
        entityLabel: ticketTitle,
        referenceId,
        involvedUserIds: activityInvolvedUserIds,
        description: `removed "${target.name}" from "${ticketTitle}"`,
      });
    } catch (error) {
      notifyApiError(toast, error, "Failed to remove attachment");
    } finally {
      setIsRemoving(false);
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
              <button
                type="button"
                onClick={() => setAttachmentToRemove(file)}
                disabled={isRemoving}
                className="shrink-0 text-ink-faint hover:text-danger disabled:opacity-50"
                aria-label={`Remove ${file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={attachmentToRemove !== null}
        onClose={() => setAttachmentToRemove(null)}
        onConfirm={handleRemoveAttachment}
        title="Remove attachment"
        description={
          attachmentToRemove
            ? `Are you sure you want to remove "${attachmentToRemove.name}"? This can't be undone.`
            : ""
        }
        confirmLabel="Remove"
      />
    </section>
  );
}
