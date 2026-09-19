import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export interface StatTile {
  label: string;
  value: number;
  caption: string;
  icon: ComponentType<LucideProps>;
  tint: string;
  iconColor: string;
  valueColor: string;
  barColor: string;
}

/** The dashboard's stat tile — icon bubble, colored top bar, and a caption line. */
export function StatTileCard({
  label,
  value,
  caption,
  icon: Icon,
  tint,
  iconColor,
  valueColor,
  barColor,
}: StatTile) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-surface p-4">
      <div className={`absolute inset-x-0 top-0 h-1 ${barColor}`} />
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint} ${iconColor}`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{label}</p>
          <p className={`text-2xl font-semibold ${valueColor}`}>{value}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-faint">{caption}</p>
    </div>
  );
}
