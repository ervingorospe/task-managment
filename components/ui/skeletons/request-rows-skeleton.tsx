import { Skeleton } from "./skeleton";

/** Matches RequestList's row shape: reference id above title+badge, description, meta line. */
export function RequestRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-4">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-16 rounded-sm" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-48 rounded-sm" />
              <Skeleton className="h-4 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full max-w-md rounded-sm" />
            <Skeleton className="h-3 w-40 rounded-sm" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
