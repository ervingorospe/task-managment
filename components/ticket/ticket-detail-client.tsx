"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, Star, Tag as TagIcon, Trash2 } from "lucide-react";

import BackButton from "@/components/ui/buttons/button-back";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Can } from "@/components/auth/can";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { setPendingAlert } from "@/lib/helper/pending-alert";
import { useLogActivity } from "@/hooks/use-log-activity";
import { PERMISSIONS } from "@/lib/data/permissions";
import { updateTicket, deleteTicket } from "@/lib/api/tickets";
import { DueChip } from "./due-chip";
import { getDueState } from "@/lib/helper/ticket-status";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import TicketOverviewCard from "./ticket-overview-card";
import TicketDetailsCard from "./ticket-details-card";
import TicketActivityCard from "./ticket-activity-card";

interface TicketDetailClientProps {
  ticket: TicketDetail;
  organization: OrganizationDetail;
}

export default function TicketDetailClient({
  ticket,
  organization,
}: TicketDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");
  const slug = organization.settings?.slug;

  const [title, setTitle] = useState(ticket.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(ticket.title);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Lifted (rather than owned by TicketDetailsCard) so the header banner
  // below stays in sync when the status or due date changes.
  const [tag, setTag] = useState<TagDetail>(ticket.tag);
  const [dueDate, setDueDate] = useState(ticket.dueDate);
  const dueState = getDueState({ tag, dueDate });

  // Also lifted — TicketCommentsSection (via TicketOverviewCard) needs the
  // current assignee list too, for @mention suggestions and for who gets
  // tagged "involved" on a comment's activity log entry. Without this it
  // silently used to keep the page-load assignees forever.
  const [assignees, setAssignees] = useState<MemberDetail[]>(
    ticket.assignees,
  );

  const [starred, setStarred] = useState(ticket.starred);

  function handleToggleStar() {
    const nowStarred = !starred;
    setStarred(nowStarred);

    updateTicket(ticket.id, { starred: nowStarred }).catch((error) => {
      setStarred(!nowStarred);
      notifyApiError(
        toast,
        error,
        `Failed to ${nowStarred ? "star" : "unstar"} ticket`,
      );
    });
  }

  function commitTitle() {
    const next = titleDraft.trim();
    const changed = Boolean(next) && next !== title;
    const previous = title;
    setTitle((prev) => next || prev);
    setTitleDraft(next || title);
    setIsEditingTitle(false);
    if (changed) {
      updateTicket(ticket.id, { title: next }).catch((error) => {
        setTitle(previous);
        setTitleDraft(previous);
        notifyApiError(toast, error, "Failed to update title");
      });
      toast("Ticket title updated");
      logTicketActivity({
        orgId: organization.id,
        action: "title_updated",
        entityId: ticket.id,
        entityLabel: next,
        referenceId: ticket.referenceId,
        involvedUserIds: [
          ticket.client?.user?.id,
          ...assignees.map((a) => a.user?.id),
        ],
        description: `renamed ticket "${title}" to "${next}"`,
      });
    }
  }

  function cancelTitleEdit() {
    setTitleDraft(title);
    setIsEditingTitle(false);
  }

  async function handleDelete() {
    try {
      await deleteTicket(ticket.id);
    } catch (error) {
      notifyApiError(toast, error, "Failed to delete ticket");
      return;
    }

    logTicketActivity({
      orgId: organization.id,
      action: "removed",
      entityId: ticket.id,
      entityLabel: title,
      referenceId: ticket.referenceId,
      involvedUserIds: [
        ticket.client?.user?.id,
        ...assignees.map((a) => a.user?.id),
      ],
      description: `deleted ticket "${title}"`,
    });
    setPendingAlert(`Ticket ${title} was removed`, "error");
    router.push(
      slug ? `/dashboard/organizations/${slug}/tickets` : "/dashboard",
    );
  }

  return (
    <div>
      <BackButton />

      {/* Header — the top bar and icon bubble pick up the ticket's own tag color */}
      <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-5">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: tag.color }}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${tag.color}1A`, color: tag.color }}
            >
              <TagIcon size={20} />
            </span>

            <div className="min-w-0 flex-1">
              <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
                {slug ? (
                  <Link
                    href={`/dashboard/organizations/${slug}/tickets`}
                    className="hover:text-ink"
                  >
                    {organization.organizationName}
                  </Link>
                ) : (
                  <span>{organization.organizationName}</span>
                )}
                <ChevronRight size={12} />
                <span>Tickets</span>
              </nav>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faint">
                  {ticket.referenceId}
                </span>
                <span
                  className="text-xs font-medium"
                  style={{ color: tag.color }}
                >
                  {tag.tagName}
                </span>
                {dueState && <DueChip state={dueState} />}
              </div>

              {isEditingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTitle();
                    }
                    if (e.key === "Escape") cancelTitleEdit();
                  }}
                  className="mt-1 w-full rounded border border-line bg-surface px-2 py-1 text-xl font-semibold text-ink focus:border-accent-text focus:outline-none"
                />
              ) : (
                <div className="group mt-1 flex items-center gap-2">
                  <h1 className="truncate text-xl font-semibold text-ink">
                    {title}
                  </h1>
                  <Can action={PERMISSIONS.TICKET_UPDATE}>
                    <button
                      type="button"
                      aria-label="Edit title"
                      onClick={() => setIsEditingTitle(true)}
                      className="text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                    >
                      <Pencil size={14} />
                    </button>
                  </Can>
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStar}
              aria-label={starred ? "Unstar ticket" : "Star ticket"}
              aria-pressed={starred}
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-ink-faint transition-colors hover:text-ink"
            >
              <Star
                size={16}
                className={starred ? "fill-warning text-warning" : ""}
              />
            </button>

            <Can action={PERMISSIONS.TICKET_REMOVE}>
              <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                <Trash2 size={14} className="mr-1.5" />
                Remove
              </Button>
            </Can>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <TicketOverviewCard
            ticketId={ticket.id}
            ticketTitle={title}
            referenceId={ticket.referenceId}
            description={ticket.description}
            attachments={ticket.attachments}
            comments={ticket.comments}
            client={ticket.client}
            assignees={assignees}
            organization={organization}
          />
        </div>

        <div className="space-y-6">
          <TicketDetailsCard
            ticketId={ticket.id}
            referenceId={ticket.referenceId}
            ticketTitle={title}
            tag={tag}
            onChangeTag={setTag}
            client={ticket.client}
            assignees={assignees}
            onAssigneesChange={setAssignees}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
            organization={organization}
          />

          <TicketActivityCard ticketId={ticket.id} createdAt={ticket.createdAt} />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete ticket"
        description={
          <>
            Are you sure you want to delete <strong>{title}</strong>? This
            can&apos;t be undone.
          </>
        }
        confirmLabel="Delete"
      />
    </div>
  );
}
