"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Pencil, Star, Tag as TagIcon, Trash2 } from "lucide-react";

import BackButton from "@/components/ui/buttons/button-back";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/providers/toast-provider";
import { notifyApiError } from "@/lib/helper/api-error-toast";
import { setPendingAlert } from "@/lib/helper/pending-alert";
import { useLogActivity } from "@/hooks/use-log-activity";
import { updateTicket, updateTicketStar, deleteTicket } from "@/lib/api/tickets";
import { getDefaultTags } from "@/lib/data/organizations";
import { DueChip } from "./due-chip";
import { getDueState } from "@/lib/helper/ticket-status";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import TicketOverviewCard from "./ticket-overview-card";
import PersonalTicketDetailsCard from "./personal-ticket-details-card";
import TicketActivityCard from "./ticket-activity-card";

interface PersonalTicketDetailClientProps {
  ticket: TicketDetail;
}

/** Same shape as TicketDetailClient, minus everything org-specific
 * (breadcrumb org name, client/assignee editing, org tag templates). */
export default function PersonalTicketDetailClient({
  ticket,
}: PersonalTicketDetailClientProps) {
  const router = useRouter();
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");

  const [title, setTitle] = useState(ticket.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(ticket.title);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [tag, setTag] = useState<TagDetail>(ticket.tag);
  const [dueDate, setDueDate] = useState(ticket.dueDate);
  const dueState = getDueState({ tag, dueDate });

  const [starred, setStarred] = useState(ticket.starred);
  const [tagOptions, setTagOptions] = useState<TagDetail[]>([ticket.tag]);

  useEffect(() => {
    getDefaultTags()
      .then(setTagOptions)
      .catch(() => {
        // Falls back to just the ticket's current tag if this fails —
        // still functional, just can't change status until it succeeds.
      });
  }, []);

  function handleToggleStar() {
    const nowStarred = !starred;
    setStarred(nowStarred);

    updateTicketStar(ticket.id, nowStarred).catch((error) => {
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
        action: "title_updated",
        entityId: ticket.id,
        entityLabel: next,
        referenceId: ticket.referenceId,
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
      action: "removed",
      entityId: ticket.id,
      entityLabel: title,
      referenceId: ticket.referenceId,
      description: `deleted ticket "${title}"`,
    });
    setPendingAlert(`Ticket ${title} was removed`, "error");
    router.push("/dashboard/tickets");
  }

  return (
    <div>
      <BackButton />

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
                <Link href="/dashboard/tickets" className="hover:text-ink">
                  Personal
                </Link>
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
                  <button
                    type="button"
                    aria-label="Edit title"
                    onClick={() => setIsEditingTitle(true)}
                    className="text-ink-faint opacity-0 transition-opacity hover:text-ink group-hover:opacity-100"
                  >
                    <Pencil size={14} />
                  </button>
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

            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={14} className="mr-1.5" />
              Remove
            </Button>
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
            client={null}
            assignees={[]}
            organization={null}
            hideComments
          />
        </div>

        <div className="space-y-6">
          <PersonalTicketDetailsCard
            ticketId={ticket.id}
            referenceId={ticket.referenceId}
            ticketTitle={title}
            tag={tag}
            onChangeTag={setTag}
            tagOptions={tagOptions}
            dueDate={dueDate}
            onDueDateChange={setDueDate}
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
