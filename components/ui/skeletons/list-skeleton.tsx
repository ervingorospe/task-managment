import clsx from "clsx";
import { Skeleton, SkeletonCircle, SkeletonText } from "./skeleton";

interface ListSkeletonProps {
  rows?: number;
  /** Shows a leading avatar/icon circle per row — matches List.ListItem's `leading` slot. */
  withLeading?: boolean;
  /** Shows a trailing control placeholder per row (button/badge) — matches `trailing`. */
  withTrailing?: boolean;
  leadingSize?: string;
  className?: string;
}

/** Reusable stand-in for any `List` of `List.ListItem`s — members, roles, tags, invites, etc. */
export function ListSkeleton({
  rows = 4,
  withLeading = true,
  withTrailing = true,
  leadingSize,
  className,
}: ListSkeletonProps) {
  return (
    <div
      className={clsx(
        "divide-y divide-line rounded border border-line bg-surface",
        className,
      )}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            {withLeading && <SkeletonCircle size={leadingSize} />}
            <div className="min-w-0 space-y-1.5">
              <SkeletonText width="w-32" />
              <SkeletonText width="w-44" className="h-3" />
            </div>
          </div>
          {withTrailing && <Skeleton className="h-7 w-16 shrink-0 rounded" />}
        </div>
      ))}
    </div>
  );
}
