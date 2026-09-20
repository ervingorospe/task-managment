import { Skeleton, SkeletonText } from "./skeleton";

interface PageHeaderSkeletonProps {
  /** Shows a button-shaped placeholder at the top right, for pages with a primary action. */
  withAction?: boolean;
}

/** Matches the title + subtitle (+ optional action button) pattern every top-level page starts with. */
export function PageHeaderSkeleton({ withAction }: PageHeaderSkeletonProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <SkeletonText width="w-40" className="h-5" />
        <SkeletonText width="w-64" />
      </div>
      {withAction && <Skeleton className="h-9 w-32 rounded" />}
    </div>
  );
}
