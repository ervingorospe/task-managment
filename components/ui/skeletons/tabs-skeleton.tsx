import { Skeleton } from "./skeleton";

/** Matches the underlined tab-row pattern (Info/Members/Tickets, Information/Members/Settings). */
export function TabsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex gap-6 border-b border-line pb-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-4 w-20 rounded-sm" />
      ))}
    </div>
  );
}
