"use client";

import { memo, useState, type KeyboardEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";

import List from "@/components/ui/list";
import { ColorPicker } from "@/components/ui/color-picker";
import { MetaBadge } from "@/components/ui/meta-badge";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";
import { IconButton } from "@/components/ui/buttons";

interface TagListProps {
  tags: TagDetail[];
  onUpdateTagColor: (id: number, color: string) => void;
  onRemoveTag: (id: number) => void;
  onRenameTag: (id: number, name: string) => string | undefined;
}

interface TagListItemProps {
  tag: TagDetail;
  onUpdateTagColor: (id: number, color: string) => void;
  onRemoveTag: (id: number) => void;
  onRenameTag: (id: number, name: string) => string | undefined;
  /** false once this is the organization's only remaining tag. */
  canDelete: boolean;
}

const TagListItem = memo(function TagListItem({
  tag,
  onUpdateTagColor,
  onRemoveTag,
  onRenameTag,
  canDelete,
}: TagListItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(tag.tagName);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setDraftName(tag.tagName);
    setError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setError(null);
  }

  function saveEditing() {
    const name = draftName.trim();

    if (!name || name === tag.tagName) {
      cancelEditing();
      return;
    }

    const renameError = onRenameTag(tag.id, name);

    if (renameError) {
      setError(renameError);
      return;
    }

    setIsEditing(false);
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditing();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  }

  return (
    <List.ListItem
      title={
        isEditing ? (
          <div>
            <input
              autoFocus
              type="text"
              value={draftName}
              onChange={(e) => {
                setDraftName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="w-full rounded border border-line bg-surface px-2 py-1 text-sm text-ink focus:border-accent-text focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>
        ) : (
          <span className="flex items-center gap-2">
            {tag.tagName}
            {tag.isDefault && <MetaBadge>Default</MetaBadge>}
          </span>
        )
      }
      trailing={
        isEditing ? (
          <div className="flex items-center gap-1">
            <IconButton
              label="Save tag name"
              icon={<Check size={15} />}
              onClick={saveEditing}
            />
            <IconButton
              label="Cancel"
              icon={<X size={15} />}
              onClick={cancelEditing}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ColorPicker
              value={tag.color}
              onChange={(color) => onUpdateTagColor(tag.id, color)}
            />

            <Can action={PERMISSIONS.TAG_UPDATE}>
              <IconButton
                label={`Rename ${tag.tagName} tag`}
                icon={<Pencil size={15} />}
                onClick={startEditing}
              />
            </Can>

            <Can action={PERMISSIONS.TAG_REMOVE}>
              <IconButton
                label={
                  canDelete
                    ? `Delete ${tag.tagName} tag`
                    : "At least one tag is required"
                }
                icon={<Trash2 size={15} />}
                onClick={() => onRemoveTag(tag.id)}
                disabled={!canDelete}
              />
            </Can>
          </div>
        )
      }
    />
  );
});

export default function TagList({
  tags,
  onUpdateTagColor,
  onRemoveTag,
  onRenameTag,
}: TagListProps) {
  const canDelete = tags.length > 1;

  return (
    <Can action={PERMISSIONS.TAG_VIEW}>
      <List className="max-h-[620px] overflow-y-auto">
        {tags.map((tag) => (
          <TagListItem
            key={tag.id}
            tag={tag}
            onUpdateTagColor={onUpdateTagColor}
            onRemoveTag={onRemoveTag}
            onRenameTag={onRenameTag}
            canDelete={canDelete}
          />
        ))}
      </List>
    </Can>
  );
}
