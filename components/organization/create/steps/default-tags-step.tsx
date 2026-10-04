"use client";

import { useStepForm } from "@/hooks/use-step-form";
import { useOrganizationDefaults } from "@/providers/organization-defaults.provider";
import TagManager from "@/components/organization/tag/tag-manager";
import { tagsSchema } from "@/lib/schemas/organization.schema";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";

export default function DefaultTagsStep() {
  const { tags: defaultTags, capacity } = useOrganizationDefaults();
  const { watch, setValue } = useStepForm(tagsSchema, { tags: defaultTags });

  const tags = watch("tags") as TagDetail[];

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

    setValue("tags", [...tags, newTag], {
      shouldValidate: true,
      shouldDirty: true,
    });
    return undefined;
  }

  function updateTagColor(id: number, color: string) {
    setValue(
      "tags",
      tags.map((t) => (t.id === id ? { ...t, color } : t)),
      { shouldValidate: true, shouldDirty: true },
    );
  }

  function renameTag(id: number, name: string): string | undefined {
    if (
      tags.some(
        (t) => t.id !== id && t.tagName.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return `A tag named "${name}" already exists`;
    }

    setValue(
      "tags",
      tags.map((t) => (t.id === id ? { ...t, tagName: name } : t)),
      { shouldValidate: true, shouldDirty: true },
    );
    return undefined;
  }

  // No confirmation here, on purpose — same reasoning as RolesStep: nothing
  // real exists yet during setup for a delete to affect.
  function onDeleteTag(id: number) {
    setValue(
      "tags",
      tags.filter((t) => t.id !== id),
      { shouldValidate: true, shouldDirty: true },
    );
  }

  return (
    <TagManager
      title="Default Tags"
      subtitle="Set up tags that can be used across your projects and tickets."
      tags={tags}
      capacity={capacity.tags}
      addTag={addTag}
      updateTagColor={updateTagColor}
      renameTag={renameTag}
      onDeleteTag={onDeleteTag}
    />
  );
}
