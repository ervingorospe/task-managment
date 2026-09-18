"use client";

import { useState, type KeyboardEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/buttons/button";
import { CapacityHeader } from "@/components/ui/capacity-header";
import TagList from "./tag-list";
import { TagDetail } from "@/lib/types/organization/tag-detail.type";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Can } from "@/components/auth/can";

interface TagManagerProps {
  title?: string;
  subtitle?: string;
  tags: TagDetail[];
  capacity: number;
  addTag: (name: string) => string | undefined;
  onDeleteTag: (id: number) => void;
  updateTagColor: (id: number, color: string) => void;
}

export default function TagManager({
  title = "Tags",
  subtitle = "Create and manage tags.",
  tags,
  capacity,
  addTag,
  onDeleteTag,
  updateTagColor,
}: TagManagerProps) {
  const atCapacity = tags.length >= capacity;
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const name = inputValue.trim();

    if (!name) return;

    const error = addTag(name);

    if (error) {
      setError(error);
      return;
    }

    setInputValue("");
    setError(null);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;

    e.preventDefault();
    handleAdd();
  }

  return (
    <Can action={PERMISSIONS.TAG_VIEW}>
      <div className="space-y-5">
        <CapacityHeader
          title={title}
          subtitle={subtitle}
          used={tags.length}
          capacity={capacity}
          unitLabel="tags"
        />

        <Can action={PERMISSIONS.TAG_ADD}>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);

                if (error) {
                  setError(null);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g. On Hold"
              className="flex-1 rounded border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text"
            />

            <Button
              type="button"
              variant="secondary"
              onClick={handleAdd}
              disabled={atCapacity}
              title={atCapacity ? `Tag limit reached (${capacity})` : undefined}
            >
              <Plus size={15} className="mr-1.5" />
              Add
            </Button>
          </div>

          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </Can>

        <TagList
          tags={tags}
          onUpdateTagColor={updateTagColor}
          onRemoveTag={onDeleteTag}
        />
      </div>
    </Can>
  );
}
