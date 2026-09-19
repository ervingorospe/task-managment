"use client";

import CheckboxBase from "@/components/ui/form/checkbox-base";
import type { TrendSelection } from "@/lib/helper/ticket-reports";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";

interface TrendSeriesSelectProps {
  value: TrendSelection;
  onChange: (value: TrendSelection) => void;
  tags: TagDetail[];
}

export function TrendSeriesSelect({
  value,
  onChange,
  tags,
}: TrendSeriesSelectProps) {
  function toggleTag(id: number) {
    onChange({
      ...value,
      tagIds: value.tagIds.includes(id)
        ? value.tagIds.filter((tagId) => tagId !== id)
        : [...value.tagIds, id],
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <CheckboxBase
        checked={value.created}
        onChange={() => onChange({ ...value, created: !value.created })}
        label="Created"
      />
      <CheckboxBase
        checked={value.dueDate}
        onChange={() => onChange({ ...value, dueDate: !value.dueDate })}
        label="Due date"
      />

      <span className="h-4 w-px bg-line" />

      {tags.map((tag) => (
        <CheckboxBase
          key={tag.id}
          checked={value.tagIds.includes(tag.id)}
          onChange={() => toggleTag(tag.id)}
          label={
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.tagName}
            </span>
          }
        />
      ))}
    </div>
  );
}
