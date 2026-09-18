import type { ReactNode } from "react";

interface CapacityHeaderProps {
  title: string;
  subtitle: string;
  used: number;
  capacity: number;
  unitLabel: string;
  trailing?: ReactNode;
}

export function CapacityHeader({
  title,
  subtitle,
  used,
  capacity,
  unitLabel,
  trailing,
}: CapacityHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        <p className="mt-1 text-xs text-ink-faint">
          {used} / {capacity} {unitLabel} used
        </p>
      </div>

      {trailing}
    </div>
  );
}
