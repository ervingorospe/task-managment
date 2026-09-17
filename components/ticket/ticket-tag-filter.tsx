"use client";

import Dropdown from "@/components/ui/dropdown";
import { ChevronDown, Check } from "lucide-react";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface TicketTagFilterProps {
  tags: TagDetail[];
  value: number | null; // null = "View all"
  onChange: (tagId: number | null) => void;
}

export default function TicketTagFilter({
  tags,
  value,
  onChange,
}: TicketTagFilterProps) {
  const activeTag = tags.find((t) => t.id === value);

  return (
    <Dropdown
      align="end"
      trigger={
        <span className="flex items-center gap-1.5 text-sm text-accent-text hover:underline">
          {activeTag ? (
            <>
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeTag.color }}
              />
              {activeTag.tagName}
            </>
          ) : (
            "View all"
          )}
          <ChevronDown size={13} />
        </span>
      }
    >
      <Dropdown.DropdownItem onClick={() => onChange(null)}>
        <span className="flex-1">View all</span>
        {value === null && <Check size={13} />}
      </Dropdown.DropdownItem>
      {tags.map((tag) => (
        <Dropdown.DropdownItem
          key={tag.id}
          onClick={() => onChange(tag.id)}
          icon={
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
          }
        >
          <span className="flex-1">{tag.tagName}</span>
          {value === tag.id && <Check size={13} />}
        </Dropdown.DropdownItem>
      ))}
    </Dropdown>
  );
}
