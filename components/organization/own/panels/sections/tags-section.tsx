"use client";

import { useState } from "react";
import TagManager from "@/components/organization/tag/tag-manager";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";

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
  const [tags, setTags] = useState<TagDetail[]>(initialTags);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  function addTag(name: string): string | undefined {
    if (tags.some((t) => t.tag_name.toLowerCase() === name.toLowerCase())) {
      return `A tag named "${name}" already exists`;
    }

    const newTag: TagDetail = {
      id: Date.now(),
      tag_name: name,
      color: "#94A39D",
      isDefault: false,
    };

    setTags((prev) => [...prev, newTag]);
    // TODO: POST /organizations/:orgId/tags in the background.
    return undefined;
  }

  function updateTagColor(id: number, color: string) {
    setTags((prev) => prev.map((t) => (t.id === id ? { ...t, color } : t)));
    // TODO: PATCH /organizations/:orgId/tags/:id in the background.
  }

  function handleConfirmDelete() {
    if (!deletingTagId) return;
    setTags((prev) => prev.filter((t) => t.id !== deletingTagId));
    setDeletingTagId(null);
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
