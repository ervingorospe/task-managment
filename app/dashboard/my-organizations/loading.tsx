import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction />
      <div className="mt-6 divide-y divide-line rounded border border-line bg-surface">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-sm" />
              <Skeleton className="h-3 w-64 rounded-sm" />
            </div>
            <Skeleton className="h-7 w-28 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
