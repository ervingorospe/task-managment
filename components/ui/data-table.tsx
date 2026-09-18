"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";

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
        <div className="relative max-w-xs flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded border border-line bg-surface py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent-text"
          />
        </div>

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
