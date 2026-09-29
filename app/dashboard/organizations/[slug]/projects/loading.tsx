import { PageHeaderSkeleton, CardSkeleton, ListSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mt-6">
        <CardSkeleton>
          <ListSkeleton rows={4} />
        </CardSkeleton>
      </div>
    </div>
  );
}
