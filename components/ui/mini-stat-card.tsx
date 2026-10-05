import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export interface MiniStat {
  label: string;
  value: number;
  icon: ComponentType<LucideProps>;
  /** Fixed semantic classes — ignored when `accentColor` is set. */
  tint?: string;
  iconColor?: string;
  barColor?: string;
  valueColor?: string;
  /** Overrides tint/iconColor/barColor with an arbitrary hex — for dynamic colors like a tag. */
  accentColor?: string;
}

/** A compact version of the dashboard's stat tile — no caption line, smaller icon and text, for pages that need the numbers without spending much vertical space on them. */
export function MiniStatCard({
  label,
  value,
  icon: Icon,
  tint,
  iconColor,
  valueColor = "text-ink",
  barColor,
  accentColor,
}: MiniStat) {
  return (
    <div className="relative overflow-hidden rounded border border-line bg-surface p-2.5">
      <div
        className={
          accentColor
            ? "absolute inset-x-0 top-0 h-0.5"
            : `absolute inset-x-0 top-0 h-0.5 ${barColor}`
        }
        style={accentColor ? { backgroundColor: accentColor } : undefined}
      />
      <div className="flex items-center gap-2">
        <span
          className={
            accentColor
              ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              : `flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tint} ${iconColor}`
          }
          style={
            accentColor
              ? { backgroundColor: `${accentColor}1A`, color: accentColor }
              : undefined
          }
        >
          <Icon size={14} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-muted">{label}</p>
          <p className={`text-base font-semibold ${valueColor}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}
