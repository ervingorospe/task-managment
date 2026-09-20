"use client";

import { useState } from "react";
import TagManager from "@/components/organization/tag/tag-manager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { useToast } from "@/providers/toast-provider";
import { useLogActivity } from "@/hooks/use-log-activity";

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
  const logTagActivity = useLogActivity("tag");
  const [tags, setTags] = useState<TagDetail[]>(initialTags);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  function addTag(name: string): string | undefined {
    if (tags.some((t) => t.tagName.toLowerCase() === name.toLowerCase())) {
      return `A tag named "${name}" already exists`;
    }

    const newTag: TagDetail = {
      id: Date.now(),
      tagName: name,
      color: "#94A39D",
      isDefault: false,
    };

    setTags((prev) => [...prev, newTag]);
    logTagActivity({
      orgId: Number(orgId),
      action: "created",
      entityId: newTag.id,
      entityLabel: newTag.tagName,
      description: `created tag "${name}"`,
    });
    toast(`Tag "${name}" added`);
    // TODO: POST /organizations/:orgId/tags in the background.
    return undefined;
  }

  function updateTagColor(id: number, color: string) {
    const tag = tags.find((t) => t.id === id);
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
    if (tag) {
      logTagActivity({
        orgId: Number(orgId),
        action: "color_changed",
        entityId: id,
        entityLabel: tag.tagName,
        description: `changed the color of tag "${tag.tagName}"`,
      });
    }
    toast("Tag color updated");
    // TODO: PATCH /organizations/:orgId/tags/:id in the background.
  }

  function renameTag(id: number, name: string): string | undefined {
    if (
      tags.some(
        (t) => t.id !== id && t.tagName.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return `A tag named "${name}" already exists`;
    }

    const previousName = tags.find((t) => t.id === id)?.tagName ?? name;
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, tagName: name } : t)));
    logTagActivity({
      orgId: Number(orgId),
      action: "renamed",
      entityId: id,
      entityLabel: name,
      description: `renamed tag "${previousName}" to "${name}"`,
    });
    toast("Tag renamed");
    // TODO: PATCH /organizations/:orgId/tags/:id in the background.
    return undefined;
  }

  function handleConfirmDelete() {
    if (!deletingTagId) return;
    const removedTag = tags.find((t) => t.id === deletingTagId);
    setTags((prev) => prev.filter((t) => t.id !== deletingTagId));
    setDeletingTagId(null);
    if (removedTag) {
      logTagActivity({
        orgId: Number(orgId),
        action: "removed",
        entityId: removedTag.id,
        entityLabel: removedTag.tagName,
        description: `removed tag "${removedTag.tagName}"`,
      });
    }
    toast(
      removedTag ? `Tag "${removedTag.tagName}" removed` : "Tag removed",
      "error",
    );
    // TODO: DELETE /organizations/:orgId/tags/:id
  }

  return (
    <section className="rounded border border-line bg-surface p-5">
      <TagManager
        title="Tags"
        subtitle="Manage tags that can be used across projects and tickets."
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
