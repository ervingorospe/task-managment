"use client";

import { useState } from "react";
import TagManager from "@/components/organization/tag/tag-manager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { useToast } from "@/providers/toast-provider";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useInlineAlert } from "@/hooks/use-inline-alert";
import { useLogActivity } from "@/hooks/use-log-activity";
import { createTag, updateTag as updateTagApi, deleteTag } from "@/lib/api/tags";
import { notifyApiError } from "@/lib/helper/api-error-toast";

interface TagsSectionProps {
  tags: TagDetail[];
  capacity: number;
  orgId: string | number;
}

export default function TagsSection({
  tags: initialTags,
  capacity,
  orgId,
}: TagsSectionProps) {
  const toast = useToast();
  const { alert, showAlert, dismissAlert } = useInlineAlert();
  const logTagActivity = useLogActivity("tag");
  const [tags, setTags] = useState<TagDetail[]>(initialTags);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  function addTag(name: string): string | undefined {
    if (tags.some((t) => t.tagName.toLowerCase() === name.toLowerCase())) {
      return `A tag named "${name}" already exists`;
    }

    const tempId = Date.now();
    const newTag: TagDetail = {
      id: tempId,
      tagName: name,
      color: "#94A39D",
      isDefault: false,
    };

    setTags((prev) => [...prev, newTag]);

    createTag(Number(orgId), { tagName: name, color: newTag.color })
      .then((created) => {
        setTags((prev) => prev.map((t) => (t.id === tempId ? created : t)));
        logTagActivity({
          orgId: Number(orgId),
          action: "created",
          entityId: created.id,
          entityLabel: created.tagName,
          description: `created tag "${name}"`,
        });
        showAlert(`Tag "${name}" added`);
      })
      .catch((error) => {
        setTags((prev) => prev.filter((t) => t.id !== tempId));
        notifyApiError(toast, error, `Failed to create tag "${name}"`);
      });

    return undefined;
  }

  // Only ever called with an id that already exists in `tags`, so this
  // lookup always succeeds.
  function updateTagColor(id: number, color: string) {
    const tag = tags.find((t) => t.id === id)!;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));

    updateTagApi(id, { color })
      .then(() => {
        logTagActivity({
          orgId: Number(orgId),
          action: "color_changed",
          entityId: id,
          entityLabel: tag.tagName,
          description: `changed the color of tag "${tag.tagName}"`,
        });
      })
      .catch((error) => {
        setTags((prev) => prev.map((t) => (t.id === id ? tag : t)));
        notifyApiError(toast, error, "Failed to update tag color");
      });
  }

  function renameTag(id: number, name: string): string | undefined {
    if (
      tags.some(
        (t) => t.id !== id && t.tagName.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return `A tag named "${name}" already exists`;
    }

    // Only ever called with an id that already exists in `tags`, so this
    // lookup always succeeds.
    const previous = tags.find((t) => t.id === id)!;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, tagName: name } : t)));

    updateTagApi(id, { tagName: name })
      .then(() => {
        logTagActivity({
          orgId: Number(orgId),
          action: "renamed",
          entityId: id,
          entityLabel: name,
          description: `renamed tag "${previous.tagName}" to "${name}"`,
        });
        showAlert("Tag renamed");
      })
      .catch((error) => {
        setTags((prev) => prev.map((t) => (t.id === id ? previous : t)));
        notifyApiError(toast, error, `Failed to rename tag to "${name}"`);
      });

    return undefined;
  }

  // Only ever invoked as the delete ConfirmDialog's onConfirm, which only
  // renders once deletingTagId is already set and always matches a tag
  // already in `tags`.
  function handleConfirmDelete() {
    const removedId = deletingTagId!;
    const removedTag = tags.find((t) => t.id === removedId)!;
    setTags((prev) => prev.filter((t) => t.id !== removedId));
    setDeletingTagId(null);

    deleteTag(removedId)
      .then(() => {
        logTagActivity({
          orgId: Number(orgId),
          action: "removed",
          entityId: removedTag.id,
          entityLabel: removedTag.tagName,
          description: `removed tag "${removedTag.tagName}"`,
        });
        showAlert(`Tag "${removedTag.tagName}" removed`, "error");
      })
      .catch((error) => {
        setTags((prev) => [...prev, removedTag]);
        notifyApiError(toast, error, "Failed to delete tag");
      });
  }

  return (
    <section className="rounded border border-line bg-surface p-5">
      <TagManager
        title="Tags"
        subtitle="Manage tags that can be used across projects and tickets."
        banner={
          alert && (
            <InlineAlert
              message={alert.message}
              variant={alert.variant}
              onDismiss={dismissAlert}
            />
          )
        }
        tags={tags}
        addTag={addTag}
        onDeleteTag={setDeletingTagId}
        updateTagColor={updateTagColor}
        renameTag={renameTag}
        capacity={capacity}
      />

      <Can action={PERMISSIONS.TAG_REMOVE}>
        <ConfirmDialog
          open={deletingTagId !== null}
          onClose={() => setDeletingTagId(null)}
          onConfirm={handleConfirmDelete}
          title="Remove tag?"
          confirmLabel="Remove tag"
          description="Are you sure you want to remove this tag?"
        />
      </Can>
    </section>
  );
}
