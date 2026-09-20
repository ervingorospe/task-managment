import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";

interface DataTableSkeletonProps {
  children: ReactNode;
  withFilter?: boolean;
}

/** Matches DataTable's shell: search+filter bar on top, content, pagination bar on the bottom. */
export function DataTableSkeleton({
  children,
  withFilter = true,
}: DataTableSkeletonProps) {
  return (
    <div className="rounded border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <Skeleton className="h-8 w-full max-w-xs rounded" />
        {withFilter && <Skeleton className="h-8 w-20 shrink-0 rounded" />}
      </div>

      {children}

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <Skeleton className="h-3 w-24 rounded-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
    </div>
  );
}
