import clsx from "clsx";
import type { CSSProperties } from "react";

/** Base pulsing placeholder block — every other skeleton piece is built from this. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={clsx("animate-pulse rounded bg-line/70", className)}
      style={style}
    />
  );
}

/** A single line of placeholder text. `width` accepts any Tailwind width class (e.g. "w-32", "w-2/3"). */
export function SkeletonText({
  width = "w-full",
  className,
}: {
  width?: string;
  className?: string;
}) {
  return <Skeleton className={clsx("h-3.5 rounded-sm", width, className)} />;
}

export function SkeletonCircle({
  size = "h-8 w-8",
  className,
}: {
  size?: string;
  className?: string;
}) {
  return <Skeleton className={clsx("shrink-0 rounded-full", size, className)} />;
}
