"use client";

import { Paperclip } from "lucide-react";
import { ClampedText } from "@/components/ui/clamped-text";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { toPlainText } from "@/lib/helper/render-description";

interface TicketDescriptionCellProps {
  ticketId: number;
  description?: string;
  attachments: TicketAttachment[];
  maxLines?: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TicketDescriptionCell({
  ticketId,
  description,
  attachments,
}: TicketDescriptionCellProps) {
  const hasContent = Boolean(description?.trim());
  const plainText = toPlainText(description);

  return (
    <div className="max-w-md">
      {!hasContent ? (
        <span className="text-ink-faint">—</span>
      ) : (
        <ClampedText text={plainText} href={`/dashboard/tickets/${ticketId}`} />
      )}

      {attachments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {attachments.map((file) => (
            <li key={file.id}>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent-text hover:underline"
              >
                <Paperclip size={11} />

                <span className="truncate">{file.name}</span>

                <span className="shrink-0 text-ink-faint">
                  ({formatSize(file.size)})
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
