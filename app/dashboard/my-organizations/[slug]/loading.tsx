import BackButton from "@/components/ui/buttons/button-back";
import {
  Skeleton,
  TabsSkeleton,
  OrganizationInfoSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <BackButton />

      <div className="flex items-center gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
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
