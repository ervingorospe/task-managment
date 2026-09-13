import type { ReactNode } from "react";
import clsx from "clsx";

interface ListProps {
  children: ReactNode;
  className?: string;
}

interface ListItemProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

function List({ children, className }: ListProps) {
  return (
    <div
      className={clsx(
        "divide-y divide-line rounded border border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  className,
}: ListItemProps) {
  return (
    <div
      className={clsx(
        "flex items-start justify-between gap-3 px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {leading && <div className="mt-0.5 shrink-0">{leading}</div>}

        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">{title}</div>

          {subtitle && (
            <div className="mt-0.5 text-xs text-ink-muted">{subtitle}</div>
          )}
        </div>
      </div>

      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

List.ListItem = ListItem;

export default List;
