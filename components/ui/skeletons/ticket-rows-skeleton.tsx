import { Skeleton, SkeletonCircle } from "./skeleton";

/** Matches TicketList's row shape: star, reference id, title+meta, description, assignees, tag. */
export function TicketRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.from({ length: rows }, (_, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            <td className="w-8 px-4 py-3">
              <Skeleton className="h-4 w-4 rounded-sm" />
            </td>
            <td className="w-20 px-2 py-3">
              <Skeleton className="h-3 w-14 rounded-sm" />
            </td>
            <td className="px-4 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-40 rounded-sm" />
                <Skeleton className="h-3 w-24 rounded-sm" />
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full max-w-[160px] rounded-sm" />
                <Skeleton className="h-3 w-3/4 max-w-[120px] rounded-sm" />
              </div>
            </td>
            <td className="px-4 py-3">
              <SkeletonCircle size="h-6 w-6" />
            </td>
            <td className="px-4 py-3">
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
