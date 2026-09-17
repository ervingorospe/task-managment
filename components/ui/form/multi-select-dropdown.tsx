"use client";

import { useState, type ReactNode } from "react";
import Dropdown from "@/components/ui/dropdown";
import CheckboxBase from "./checkbox-base";
import { ChevronDown, Search } from "lucide-react";

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
}

export default function MultiSelectDropdown({
  value,
  onChange,
  options,
  placeholder = "Select...",
  emptyMessage = "No options available",
  trigger,
  maxVisible = 10,
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
    <Dropdown align="start" trigger={trigger ?? defaultTrigger}>
      <div className="w-64 p-2">
        <div className="relative mb-2">
          <Search
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members"
            className="w-3/4 rounded border border-line bg-surface py-1.5 pl-7 pr-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent-text"
          />
        </div>

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
