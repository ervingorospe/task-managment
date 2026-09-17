"use client";

import Dropdown from "@/components/ui/dropdown";
import { Check, ChevronDown } from "lucide-react";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface TagPickerProps {
  value: TagDetail;
  options: TagDetail[];
  onChange: (tag: TagDetail) => void;
}

export function TagPicker({ value, options, onChange }: TagPickerProps) {
  return (
    <Dropdown
      align="end"
      trigger={
        <span className="flex items-center gap-1.5 rounded-sm border border-line px-2 py-1 text-xs text-ink hover:bg-canvas">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: value.color }}
          />
          {value.tagName}
          <ChevronDown size={12} className="text-ink-faint" />
        </span>
      }
    >
      {options.map((tag) => (
        <Dropdown.DropdownItem
          key={tag.id}
          onClick={() => onChange(tag)}
          icon={
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          }
        >
          <span className="flex-1">{tag.tagName}</span>
          {tag.id === value.id && <Check size={13} />}
        </Dropdown.DropdownItem>
      ))}
    </Dropdown>
  );
}
