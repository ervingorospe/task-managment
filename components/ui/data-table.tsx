"use client";

import type { ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

interface DataTableProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** The filter trigger + dropdown panel — passed in so this stays reusable across different data types. */
  filterAction?: ReactNode;
  /** The actual table/list content. */
  children: ReactNode;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataTable({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterAction,
  children,
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: DataTableProps) {
  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <SearchInput
          containerClassName="max-w-xs flex-1"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />

        {filterAction}
      </div>

      {children}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
