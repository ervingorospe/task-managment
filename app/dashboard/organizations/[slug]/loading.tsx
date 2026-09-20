import {
  Skeleton,
  TabsSkeleton,
  OrganizationInfoSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded-sm" />
          <Skeleton className="h-3 w-56 rounded-sm" />
        </div>
      </div>

      <div className="mt-6">
        <TabsSkeleton count={3} />
      </div>

      <div className="mt-6">
        <OrganizationInfoSkeleton />
      </div>
    </div>
  );
}
