import clsx from "clsx";
import { Skeleton, SkeletonCircle } from "./skeleton";

interface StatTilesSkeletonProps {
  count?: number;
  /** "mini" matches MiniStatCard (compact row); "large" matches StatTileCard (dashboard/reports). */
  variant?: "mini" | "large";
  className?: string;
}

/** Reusable stand-in for any row of number/stat tiles — MiniStatCard or StatTileCard. */
export function StatTilesSkeleton({
  count = 4,
  variant = "large",
  className,
}: StatTilesSkeletonProps) {
  const isMini = variant === "mini";

  return (
    <div
      className={clsx(
        "grid gap-3",
        isMini
          ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
          : "grid-cols-2 gap-4 sm:grid-cols-4",
        className,
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={clsx(
            "relative overflow-hidden rounded border border-line bg-surface",
            isMini ? "p-2.5" : "rounded-lg p-4",
          )}
        >
          <Skeleton
            className={clsx("absolute inset-x-0 top-0", isMini ? "h-0.5" : "h-1")}
          />
          <div className="flex items-center gap-3">
            <SkeletonCircle size={isMini ? "h-7 w-7" : "h-10 w-10"} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className={clsx("h-3 rounded-sm", isMini ? "w-12" : "w-16")} />
              <Skeleton className={clsx("h-4 rounded-sm", isMini ? "w-8" : "w-10")} />
            </div>
          </div>
          {!isMini && <Skeleton className="mt-3 h-3 w-24 rounded-sm" />}
        </div>
      ))}
    </div>
  );
}
