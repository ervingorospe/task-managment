import BackButton from "@/components/ui/buttons/button-back";
import { CardSkeleton, DetailHeaderSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <BackButton />
      <DetailHeaderSkeleton />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <CardSkeleton withSubtitle={false}>
            <div className="space-y-2">
              <Skeleton className="h-3 w-full rounded-sm" />
              <Skeleton className="h-3 w-full rounded-sm" />
              <Skeleton className="h-3 w-2/3 rounded-sm" />
            </div>
          </CardSkeleton>

          <CardSkeleton withSubtitle={false}>
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded" />
              <Skeleton className="h-8 w-full rounded" />
            </div>
          </CardSkeleton>
        </div>

        <div className="space-y-6">
          <CardSkeleton withSubtitle={false}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded-sm" />
                <Skeleton className="h-2.5 w-20 rounded-sm" />
              </div>
            </div>
          </CardSkeleton>

          <CardSkeleton withSubtitle={false}>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-32 rounded-sm" />
                    <Skeleton className="h-2.5 w-20 rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          </CardSkeleton>
        </div>
      </div>
    </div>
  );
}
