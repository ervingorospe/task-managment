"use client";

import { Search } from "lucide-react";

export type MemberSortField = "name" | "email";

interface MemberListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortField: MemberSortField;
  onSortFieldChange: (field: MemberSortField) => void;
}

export function MemberListToolbar({
  search,
  onSearchChange,
  sortField,
  onSortFieldChange,
}: MemberListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or role"
          className="w-full rounded border border-line bg-surface py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text"
        />
      </div>

      <select
        value={sortField}
        onChange={(e) => onSortFieldChange(e.target.value as MemberSortField)}
        className="rounded border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-accent-text"
      >
        <option value="name">Sort by name</option>
        <option value="email">Sort by email</option>
      </select>
    </div>
  );
}
