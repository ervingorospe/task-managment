"use client";

import { useState, type ReactNode } from "react";
import Dropdown from "@/components/ui/dropdown";
import CheckboxBase from "./checkbox-base";
import { SearchInput } from "@/components/ui/search-input";
import { ChevronDown } from "lucide-react";

interface MultiSelectOption {
  value: number;
  label: string;
}

interface MultiSelectDropdownProps {
  value: number[];
  onChange: (value: number[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  /** Custom trigger element — defaults to the standard form-field-style box. */
  trigger?: ReactNode;
  maxVisible?: number;
  isWidthFull?: boolean;
}

export default function MultiSelectDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  emptyMessage = "No options available",
  trigger,
  maxVisible = 10,
  isWidthFull = false,
}: MultiSelectDropdownProps) {
  const [search, setSearch] = useState("");

  function toggle(id: number) {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  }

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const visible = filtered.slice(0, maxVisible);
  const hiddenCount = filtered.length - visible.length;

  const summary =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? placeholder)
        : `${value.length} selected`;

  const defaultTrigger = (
    <span className="flex w-full items-center justify-between rounded border border-line bg-surface px-3 py-2 text-sm text-ink">
      <span className={value.length === 0 ? "text-ink-faint" : ""}>
        {summary}
      </span>
      <ChevronDown size={14} className="text-ink-faint" />
    </span>
  );

  return (
    <Dropdown
      align="start"
      trigger={trigger ?? defaultTrigger}
      isWidthFull={isWidthFull}
    >
      <div className="w-full p-2">
        <SearchInput
          containerClassName="mb-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members"
        />

        <div className="max-h-60 space-y-1 overflow-y-auto">
          {visible.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-ink-faint">{emptyMessage}</p>
          ) : (
            visible.map((option) => (
              <CheckboxBase
                key={option.value}
                checked={value.includes(option.value)}
                onChange={() => toggle(option.value)}
                label={option.label}
                className="px-2 py-1"
              />
            ))
          )}
        </div>

        {hiddenCount > 0 && (
          <p className="mt-1 px-2 text-xs text-ink-faint">
            +{hiddenCount} more — refine your search
          </p>
        )}
      </div>
    </Dropdown>
  );
}
