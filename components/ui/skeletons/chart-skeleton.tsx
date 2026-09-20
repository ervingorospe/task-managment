import { Skeleton, SkeletonText } from "./skeleton";

interface ChartSkeletonProps {
  variant: "pie" | "bar" | "line";
}

/** Reusable stand-in for any of the report charts, shaped roughly like the real thing. */
export function ChartSkeleton({ variant }: ChartSkeletonProps) {
  if (variant === "pie") {
    return (
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <Skeleton className="h-40 w-40 shrink-0 rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <SkeletonText width="w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className="flex h-40 items-end gap-3">
        {[60, 90, 40, 100, 70].map((h, i) => (
          <Skeleton key={i} className="w-full rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  return <Skeleton className="h-40 w-full rounded" />;
}
