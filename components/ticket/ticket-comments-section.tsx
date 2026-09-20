"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { MessageSquare } from "lucide-react";

import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { formatDateTime } from "@/lib/helper/format-date";
import { getMemberName } from "@/lib/helper/member-name";
import { getMentionableMembers } from "@/lib/helper/mentionable-members";
import {
  detectMentionTrigger,
  insertMention,
  splitOnMentions,
  type MentionTrigger,
} from "@/lib/helper/mention-text";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import type { MemberDetail } from "@/lib/types/organization/member-detail.type";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import { SectionHeading } from "./section-heading";

interface TicketCommentsSectionProps {
  ticketId: number;
  comments?: TicketComment[];
  client: MemberDetail | null;
  assignees: MemberDetail[];
  organization: OrganizationDetail;
}

type MentionField = "compose" | number;

interface MentionState {
  field: MentionField;
  trigger: MentionTrigger;
}

function MentionSuggestions({
  suggestions,
  onSelect,
}: {
  suggestions: MemberDetail[];
  onSelect: (member: MemberDetail) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-1 overflow-hidden rounded border border-line bg-surface shadow-sm">
      {suggestions.map((member) => (
        <button
          key={member.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(member)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ink hover:bg-canvas"
        >
          <Avatar
            firstName={member.user?.firstName ?? member.firstName}
            lastName={member.user?.lastName ?? member.lastName}
            size="sm"
          />
          {getMemberName(member)}
        </button>
      ))}
    </div>
  );
}

function renderCommentText(text: string, mentionableNames: string[]) {
  return splitOnMentions(text, mentionableNames).map((part, i) =>
    part.isMention ? (
      <span key={i} className="font-medium text-accent-text">
        {part.text}
      </span>
    ) : (
      <span key={i}>{part.text}</span>
    ),
  );
}

export default function TicketCommentsSection({
  ticketId,
  comments: initialComments,
  client,
  assignees,
  organization,
}: TicketCommentsSectionProps) {
  const { currentUser } = useAuth();
  const toast = useToast();
  const logTicketActivity = useLogActivity("ticket");
  const ticketTitle =
    organization.tickets.find((t) => t.id === ticketId)?.title ??
    "this ticket";

  const [comments, setComments] = useState<TicketComment[]>(
    initialComments ?? [],
  );
  const [commentDraft, setCommentDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(
    null,
  );
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<TicketComment | null>(
    null,
  );
  const [mentionState, setMentionState] = useState<MentionState | null>(null);

  const mentionableMembers = useMemo(
    () => getMentionableMembers(organization, { client, assignees }),
    [organization, client, assignees],
  );
  const mentionableNames = useMemo(
    () => mentionableMembers.map(getMemberName),
    [mentionableMembers],
  );

  const mentionSuggestions = useMemo(() => {
    if (!mentionState) return [];
    const query = mentionState.trigger.query.toLowerCase();
    return mentionableMembers
      .filter((member) => getMemberName(member).toLowerCase().includes(query))
      .slice(0, 5);
  }, [mentionState, mentionableMembers]);

  function updateMentionState(
    field: MentionField,
    value: string,
    selectionStart: number | null,
  ) {
    const trigger = detectMentionTrigger(value, selectionStart ?? value.length);
    setMentionState((prev) => {
      if (trigger) return { field, trigger };
      return prev?.field === field ? null : prev;
    });
  }

  function handleComposeChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setCommentDraft(e.target.value);
    updateMentionState("compose", e.target.value, e.target.selectionStart);
  }

  function handleEditChange(e: ChangeEvent<HTMLTextAreaElement>) {
    if (editingCommentId === null) return;
    setEditCommentDraft(e.target.value);
    updateMentionState(editingCommentId, e.target.value, e.target.selectionStart);
  }

  function selectMention(member: MemberDetail) {
    if (!mentionState) return;
    const name = getMemberName(member);

    if (mentionState.field === "compose") {
      setCommentDraft((prev) => insertMention(prev, mentionState.trigger, name));
    } else {
      setEditCommentDraft((prev) =>
        insertMention(prev, mentionState.trigger, name),
      );
    }
    setMentionState(null);
  }

  function handlePostComment() {
    const text = commentDraft.trim();
    if (!text || !currentUser) return;

    const comment: TicketComment = {
      id: Date.now(),
      ticketId,
      userId: currentUser.id,
      comment: text,
      author: {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        avatar: currentUser.avatar,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComments((prev) => [...prev, comment]);
    setCommentDraft("");
    setMentionState(null);
    logTicketActivity({
      orgId: organization.id,
      action: "commented",
      entityId: ticketId,
      entityLabel: ticketTitle,
      description: `commented on "${ticketTitle}"`,
    });
    toast("Comment added");
    // TODO: POST /tickets/:id/comments { comment: text }
  }

  function startEditComment(comment: TicketComment) {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.comment);
    setMentionState(null);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditCommentDraft("");
    setMentionState(null);
  }

  function saveEditComment(commentId: number) {
    const text = editCommentDraft.trim();
    if (!text) return;

    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, comment: text, updatedAt: new Date().toISOString() }
          : c,
      ),
    );
    setEditingCommentId(null);
    setEditCommentDraft("");
    setMentionState(null);
    logTicketActivity({
      orgId: organization.id,
      action: "comment_edited",
      entityId: ticketId,
      entityLabel: ticketTitle,
      description: `edited a comment on "${ticketTitle}"`,
    });
    toast("Comment updated");
    // TODO: PATCH /tickets/:id/comments/:commentId { comment: text }
  }

  function handleDeleteComment() {
    if (!commentToDelete) return;

    setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
    setCommentToDelete(null);
    logTicketActivity({
      orgId: organization.id,
      action: "comment_removed",
      entityId: ticketId,
      entityLabel: ticketTitle,
      description: `removed a comment on "${ticketTitle}"`,
    });
    toast("Comment removed", "error");
    // TODO: DELETE /tickets/:id/comments/:commentId
  }

  return (
    <section>
      <SectionHeading icon={MessageSquare}>
        Comments
        {comments.length > 0 && (
          <span className="text-ink-faint">({comments.length})</span>
        )}
      </SectionHeading>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-4">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;
            const isEdited = comment.updatedAt !== comment.createdAt;

            return (
              <li key={comment.id} className="flex gap-3">
                <Avatar
                  firstName={comment.author.firstName}
                  lastName={comment.author.lastName}
                  src={comment.author.avatar ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-ink">
                      {comment.author.firstName} {comment.author.lastName}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {formatDateTime(comment.createdAt)}
                      {isEdited && " (edited)"}
                    </span>

                    {!isEditing && currentUser?.id === comment.userId && (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditComment(comment)}
                          className="text-xs font-medium text-accent-text hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentToDelete(comment)}
                          className="text-xs font-medium text-danger hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      <textarea
                        autoFocus
                        value={editCommentDraft}
                        onChange={handleEditChange}
                        rows={3}
                        className="w-full resize-none rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text focus:outline-none"
                      />
                      {mentionState?.field === comment.id && (
                        <MentionSuggestions
                          suggestions={mentionSuggestions}
                          onSelect={selectMention}
                        />
                      )}
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={cancelEditComment}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          disabled={!editCommentDraft.trim()}
                          onClick={() => saveEditComment(comment.id)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-muted">
                      {renderCommentText(comment.comment, mentionableNames)}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {currentUser && (
        <div className="mt-4 flex gap-3">
          <Avatar
            firstName={currentUser.firstName}
            lastName={currentUser.lastName}
            src={currentUser.avatar ?? undefined}
            size="sm"
          />
          <div className="flex-1 space-y-2">
            <textarea
              value={commentDraft}
              onChange={handleComposeChange}
              placeholder="Leave a comment... use @ to mention someone"
              rows={3}
              className="w-full resize-none rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text focus:outline-none"
            />
            {mentionState?.field === "compose" && (
              <MentionSuggestions
                suggestions={mentionSuggestions}
                onSelect={selectMention}
              />
            )}
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={!commentDraft.trim()}
                onClick={handlePostComment}
              >
                Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={commentToDelete !== null}
        onClose={() => setCommentToDelete(null)}
        onConfirm={handleDeleteComment}
        title="Delete comment"
        description="Are you sure you want to delete this comment? This can't be undone."
        confirmLabel="Delete"
      />
    </section>
  );
}
