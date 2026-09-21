"use client";

import { memo, type ReactNode } from "react";
import Link from "next/link";
import { Ban, Check, Paperclip, X } from "lucide-react";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/buttons/button";
import { ClampedText } from "@/components/ui/clamped-text";
import { toPlainText } from "@/lib/helper/render-description";
import { RequestStatusBadge } from "./request-status-badge";
import type { TicketRequest } from "@/lib/types/ticket/ticket-request.type";

interface RequestListProps {
  requests: TicketRequest[];
  canManage: boolean;
  /** Clients can cancel their own pending requests — separate from
   * canManage, which is the staff approve/reject capability. */
  canCancel: boolean;
  onApprove: (request: TicketRequest) => void;
  onReject: (request: TicketRequest) => void;
  onCancel: (request: TicketRequest) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RequestListComponent({
  requests,
  canManage,
  canCancel,
  onApprove,
  onReject,
  onCancel,
  emptyTitle = "No requests yet",
  emptySubtitle = "Requests submitted by clients will show up here.",
  emptyAction,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <EmptyState title={emptyTitle} subtitle={emptySubtitle}>
        {emptyAction}
      </EmptyState>
    );
  }

  return (
    <div className="divide-y divide-line">
      {requests.map((request) => (
        <div key={request.id} className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <span className="font-mono text-xs text-ink-faint">
              {request.referenceId}
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <Link
                href={`/dashboard/requests/${request.id}`}
                className="font-medium text-ink hover:text-accent-text"
              >
                {request.title}
              </Link>
              <RequestStatusBadge status={request.status} />
            </div>

            {request.description && (
              <div className="mt-1 text-sm text-ink-muted">
                <ClampedText
                  text={toPlainText(request.description)}
                  href={`/dashboard/requests/${request.id}`}
                />
              </div>
            )}

            <p className="mt-1.5 flex flex-wrap items-center gap-x-1 text-xs text-ink-faint">
              <span>
                Requested by {request.client.firstName}{" "}
                {request.client.lastName} · {formatDate(request.createdAt)}
              </span>

              {request.attachments.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  ·
                  <Paperclip size={11} />
                  {request.attachments.length}
                </span>
              )}

              {request.status === "approved" && request.ticketId && (
                <>
                  ·{" "}
                  <Link
                    href={`/dashboard/tickets/${request.ticketId}`}
                    className="text-accent-text hover:underline"
                  >
                    View ticket
                  </Link>
                </>
              )}
            </p>

            {request.status === "rejected" && request.remarks && (
              <p className="mt-1.5 rounded border border-danger-subtle bg-danger-subtle px-2.5 py-1.5 text-xs text-danger">
                {request.remarks}
              </p>
            )}
          </div>

          {canManage && request.status === "pending" && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
                onClick={() => onApprove(request)}
              >
                <Check size={13} className="mr-1" /> Approve
              </Button>
              <Button
                variant="danger"
                className="px-2.5 py-1.5 text-xs"
                onClick={() => onReject(request)}
              >
                <X size={13} className="mr-1" /> Reject
              </Button>
            </div>
          )}

          {canCancel && request.status === "pending" && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                className="px-2.5 py-1.5 text-xs"
                onClick={() => onCancel(request)}
              >
                <Ban size={13} className="mr-1" /> Cancel
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export const RequestList = memo(RequestListComponent);
