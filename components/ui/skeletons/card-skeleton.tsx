import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";

interface CardSkeletonProps {
  children: ReactNode;
  withSubtitle?: boolean;
}

/** Matches Card's bordered shell (title + subtitle + content) so any content skeleton can drop in. */
export function CardSkeleton({ children, withSubtitle = true }: CardSkeletonProps) {
  return (
    <div className="rounded border border-line bg-surface p-6">
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-40 rounded-sm" />
          {withSubtitle && <Skeleton className="h-3 w-64 rounded-sm" />}
        </div>
        {children}
      </div>
    </div>
  );
}
