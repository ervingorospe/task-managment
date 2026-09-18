import { Paperclip } from "lucide-react";

import { formatFileSize } from "@/lib/helper/ticket-status";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { SectionHeading } from "./section-heading";

interface TicketAttachmentsSectionProps {
  attachments: TicketAttachment[];
}

export default function TicketAttachmentsSection({
  attachments,
}: TicketAttachmentsSectionProps) {
  return (
    <section>
      <SectionHeading icon={Paperclip}>
        Attachments
        {attachments.length > 0 && (
          <span className="text-ink-faint">({attachments.length})</span>
        )}
      </SectionHeading>

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
