"use client";

import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

// Keeps `page` in the second slot of the window (matches the natural feel of
// paging forward one at a time), except near either edge where the window
// clamps to the first/last MAX_VISIBLE_PAGES pages instead.
function getPageWindow(page: number, totalPages: number): number[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(1, page - 1);
  const end = Math.min(start + MAX_VISIBLE_PAGES - 1, totalPages);
  start = Math.max(1, end - MAX_VISIBLE_PAGES + 1);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [15, 30, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const safeTotalPages = Math.max(totalPages, 1);

  const pageWindow = getPageWindow(page, safeTotalPages);
  const firstVisible = pageWindow[0];
  const lastVisible = pageWindow[pageWindow.length - 1];

  function goTo(target: number) {
    onPageChange(Math.min(Math.max(target, 1), safeTotalPages));
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <div className="flex items-center gap-2 text-ink-muted">
        <span>
          {start}–{end} of {totalItems}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-line bg-surface px-2 py-1 text-xs text-ink focus:border-accent-text"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => goTo(1)}
          disabled={page <= 1}
          className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="First page"
        >
          <ChevronFirst size={16} />
        </button>

        {firstVisible > 1 && (
          <button
            type="button"
            onClick={() => goTo(firstVisible - 4)}
            className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label="Previous set of pages"
          >
            <ChevronsLeft size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pageWindow.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => goTo(num)}
            aria-current={num === page ? "page" : undefined}
            className={`min-w-[2rem] rounded px-2 py-1.5 text-center transition-colors ${
              num === page
                ? "bg-accent-subtle font-medium text-accent-text"
                : "text-ink-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= safeTotalPages}
          className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {lastVisible < safeTotalPages && (
          <button
            type="button"
            onClick={() => goTo(lastVisible + 2)}
            className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label="Next set of pages"
          >
            <ChevronsRight size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => goTo(safeTotalPages)}
          disabled={page >= safeTotalPages}
          className="rounded p-1.5 text-ink-muted hover:bg-canvas hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Last page"
        >
          <ChevronLast size={16} />
        </button>
      </div>
    </div>
  );
}
