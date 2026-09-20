import { Skeleton } from "./skeleton";
import { StatTilesSkeleton } from "./stat-tiles-skeleton";
import { CardSkeleton } from "./card-skeleton";
import { ChartSkeleton } from "./chart-skeleton";
import { ListSkeleton } from "./list-skeleton";

/** The Dashboard's own layout, shown client-side while its organization detail loads. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32 rounded-sm" />
        <Skeleton className="h-3 w-64 rounded-sm" />
      </div>

      <StatTilesSkeleton count={4} />

      <CardSkeleton>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton variant="pie" />
          <ChartSkeleton variant="bar" />
        </div>
      </CardSkeleton>

      <CardSkeleton>
        <ChartSkeleton variant="line" />
      </CardSkeleton>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton>
          <ListSkeleton rows={5} withLeading={false} withTrailing={false} />
        </CardSkeleton>
        <CardSkeleton>
          <ListSkeleton rows={5} withLeading={false} withTrailing={false} />
        </CardSkeleton>
      </div>
    </div>
  );
}
