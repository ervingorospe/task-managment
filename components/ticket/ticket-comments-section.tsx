"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import Avatar from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime } from "@/lib/helper/format-date";
import type { TicketComment } from "@/lib/types/ticket/ticket-comment.type";
import { SectionHeading } from "./section-heading";

interface TicketCommentsSectionProps {
  ticketId: number;
  comments?: TicketComment[];
}

export default function TicketCommentsSection({
  ticketId,
  comments: initialComments,
}: TicketCommentsSectionProps) {
  const { currentUser } = useAuth();

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
    // TODO: POST /tickets/:id/comments { comment: text }
  }

  function startEditComment(comment: TicketComment) {
    setEditingCommentId(comment.id);
    setEditCommentDraft(comment.comment);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditCommentDraft("");
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
    // TODO: PATCH /tickets/:id/comments/:commentId { comment: text }
  }

  function handleDeleteComment() {
    if (!commentToDelete) return;

    setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
    setCommentToDelete(null);
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
                        onChange={(e) => setEditCommentDraft(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text focus:outline-none"
                      />
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
                      {comment.comment}
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
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Leave a comment..."
              rows={3}
              className="w-full resize-none rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text focus:outline-none"
            />
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
