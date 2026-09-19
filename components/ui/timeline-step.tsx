import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export type TimelineTone = "done" | "active" | "upcoming" | "danger";

const TONE_STYLE: Record<TimelineTone, string> = {
  done: "bg-accent-subtle text-accent-text",
  active: "bg-warning-subtle text-warning",
  upcoming: "bg-canvas text-ink-faint",
  danger: "bg-danger-subtle text-danger",
};

interface TimelineStepProps {
  icon: ComponentType<LucideProps>;
  label: string;
  date?: string;
  tone: TimelineTone;
  /** Overrides the tone's icon-bubble colors with an arbitrary hex (e.g. a tag color). */
  accentColor?: string;
  isLast?: boolean;
}

/** One step in a vertical connected-dot timeline — see request/ticket activity cards. */
export function TimelineStep({
  icon: Icon,
  label,
  date,
  tone,
  accentColor,
  isLast,
}: TimelineStepProps) {
  return (
    <li className="relative flex gap-3">
      {!isLast && (
        <span className="absolute top-6 left-[11px] h-[calc(100%-4px)] w-px bg-line" />
      )}
      <span
        className={
          accentColor
            ? "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            : `z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${TONE_STYLE[tone]}`
        }
        style={
          accentColor
            ? { backgroundColor: `${accentColor}1A`, color: accentColor }
            : undefined
        }
      >
        <Icon size={13} />
      </span>
      <div className="pb-5">
        <p
          className={`text-sm font-medium ${
            tone === "upcoming" ? "text-ink-faint" : "text-ink"
          }`}
        >
          {label}
        </p>
        {date && <p className="mt-0.5 text-xs text-ink-faint">{date}</p>}
      </div>
    </li>
  );
}
