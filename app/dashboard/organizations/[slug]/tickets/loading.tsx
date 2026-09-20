import {
  PageHeaderSkeleton,
  StatTilesSkeleton,
  DataTableSkeleton,
  TicketRowsSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div>
      <PageHeaderSkeleton withAction />
      <div className="mt-4">
        <StatTilesSkeleton variant="mini" count={7} />
      </div>
      <div className="mt-6">
        <DataTableSkeleton>
          <TicketRowsSkeleton />
        </DataTableSkeleton>
      </div>
    </div>
  );
}
