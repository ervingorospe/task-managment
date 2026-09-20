import {
  PageHeaderSkeleton,
  StatTilesSkeleton,
  DataTableSkeleton,
  RequestRowsSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="mt-4 max-w-lg">
        <StatTilesSkeleton variant="mini" count={4} />
      </div>
      <div className="mt-6">
        <DataTableSkeleton>
          <div className="px-4">
            <RequestRowsSkeleton />
          </div>
        </DataTableSkeleton>
      </div>
    </div>
  );
}
