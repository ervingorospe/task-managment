"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import type { TicketAttachment } from "@/lib/types/ticket/ticket-detail.type";
import { renderDescription } from "@/lib/helper/render-description";

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
  const contentRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const hasContent = Boolean(description?.trim());
  const html = renderDescription(description);

  useEffect(() => {
    const element = contentRef.current;

    if (!element || !hasContent) {
      setIsTruncated(false);
      return;
    }

    // Let the browser render the HTML first.
    requestAnimationFrame(() => {
      if (!contentRef.current) return;

      const el = contentRef.current;

      setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    });
  }, [description, hasContent]);

  return (
    <div className="max-w-md">
      {!hasContent ? (
        <span className="text-ink-faint">—</span>
      ) : (
        <>
          <div ref={contentRef} className="ticket-description-preview">
            <div
              dangerouslySetInnerHTML={{
                __html: html,
              }}
            />
          </div>

          {isTruncated && (
            <Link
              href={`/dashboard/tickets/${ticketId}`}
              className="mt-1 inline-block text-xs font-medium text-accent-text hover:underline"
            >
              View more
            </Link>
          )}
        </>
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
