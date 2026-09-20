import { CardSkeleton } from "./card-skeleton";
import { ListSkeleton } from "./list-skeleton";
import { Skeleton } from "./skeleton";

/** The Basic Info + Roles + Tags stack shown on the Organization's Information tab — shared by
 * both the owner's (/my-organizations/:slug) and the member-facing (/organizations/:slug) pages. */
export function OrganizationInfoSkeleton() {
  return (
    <div className="space-y-8">
      <CardSkeleton>
        <div className="grid gap-5 sm:grid-cols-2">
          <Skeleton className="h-9 w-full rounded" />
          <Skeleton className="h-9 w-full rounded" />
          <Skeleton className="h-9 w-full rounded" />
          <Skeleton className="h-16 w-full rounded sm:col-span-2" />
        </div>
      </CardSkeleton>

      <CardSkeleton>
        <ListSkeleton rows={4} withLeading={false} withTrailing={false} />
      </CardSkeleton>

      <CardSkeleton>
        <ListSkeleton rows={5} withLeading={false} />
      </CardSkeleton>
    </div>
  );
}
