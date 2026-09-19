"use client";

import { SearchInput } from "@/components/ui/search-input";

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
      <SearchInput
        containerClassName="min-w-[200px] flex-1"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or role (3+ characters)"
      />

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
