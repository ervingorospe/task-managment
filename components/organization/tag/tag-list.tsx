"use client";

import { memo } from "react";
import { Trash2 } from "lucide-react";

import List from "@/components/ui/list";
import { ColorPicker } from "@/components/ui/color-picker";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { IconButton } from "@/components/ui/buttons";

interface TagListProps {
  tags: TagDetail[];
  onUpdateTagColor: (id: number, color: string) => void;
  onRemoveTag: (id: number) => void;
}

interface TagListItemProps {
  tag: TagDetail;
  onUpdateTagColor: (id: number, color: string) => void;
  onRemoveTag: (id: number) => void;
}

const TagListItem = memo(function TagListItem({
  tag,
  onUpdateTagColor,
  onRemoveTag,
}: TagListItemProps) {
  return (
    <List.ListItem
      title={
        <span className="flex items-center gap-2">
          {tag.tagName}

          {tag.isDefault && (
            <span className="rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-faint">
              Default
            </span>
          )}
        </span>
      }
      trailing={
        <div className="flex items-center gap-2">
          <ColorPicker
            value={tag.color}
            onChange={(color) => onUpdateTagColor(tag.id, color)}
          />

          {!tag.isDefault && (
            <Can action={PERMISSIONS.TAG_REMOVE}>
              <IconButton
                label={`Delete ${tag.tagName} tag`}
                icon={<Trash2 size={15} />}
                onClick={() => onRemoveTag(tag.id)}
              />
            </Can>
          )}
        </div>
      }
    />
  );
});

export default function TagList({
  tags,
  onUpdateTagColor,
  onRemoveTag,
}: TagListProps) {
  return (
    <Can action={PERMISSIONS.TAG_VIEW}>
      <List className="max-h-[620px] overflow-y-auto">
        {tags.map((tag) => (
          <TagListItem
            key={tag.id}
            tag={tag}
            onUpdateTagColor={onUpdateTagColor}
            onRemoveTag={onRemoveTag}
          />
        ))}
      </List>
    </Can>
  );
}
