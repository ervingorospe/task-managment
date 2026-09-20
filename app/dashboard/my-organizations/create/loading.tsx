import BackButton from "@/components/ui/buttons/button-back";
import { Skeleton } from "@/components/ui/skeletons";

const STEPS = 5;

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />

      <div className="space-y-2">
        <Skeleton className="h-5 w-52 rounded-sm" />
        <Skeleton className="h-3 w-72 rounded-sm" />
      </div>

      <div className="mt-8 flex items-center gap-3">
        {Array.from({ length: STEPS }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            {i < STEPS - 1 && <Skeleton className="h-px w-8" />}
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-5 rounded border border-line bg-surface p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-sm" />
          <Skeleton className="h-3 w-56 rounded-sm" />
        </div>
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-20 w-full rounded" />

        <div className="flex justify-end border-t border-line pt-5">
          <Skeleton className="h-9 w-28 rounded" />
        </div>
      </div>
    </div>
  );
}
