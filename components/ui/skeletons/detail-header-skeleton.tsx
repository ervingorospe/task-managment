import { Skeleton, SkeletonCircle } from "./skeleton";

/** Matches the ticket/request detail page's banner: colored top bar, icon bubble, breadcrumb, title. */
export function DetailHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-5">
      <Skeleton className="absolute inset-x-0 top-0 h-1" />
      <div className="flex items-start gap-3">
        <SkeletonCircle size="h-11 w-11" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-32 rounded-sm" />
          <Skeleton className="h-3 w-24 rounded-sm" />
          <Skeleton className="h-6 w-2/3 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
