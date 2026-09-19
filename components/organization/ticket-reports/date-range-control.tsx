"use client";

import { RotateCcw } from "lucide-react";
import type { DateRange } from "@/lib/helper/ticket-reports";

interface DateRangeControlProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export function DateRangeControl({ value, onChange }: DateRangeControlProps) {
  const hasValue = value.from || value.to;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
        Date range
      </span>
      <input
        type="date"
        value={value.from ?? ""}
        onChange={(e) => onChange({ ...value, from: e.target.value || null })}
        className="rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
      />
      <span className="text-xs text-ink-faint">to</span>
      <input
        type="date"
        value={value.to ?? ""}
        onChange={(e) => onChange({ ...value, to: e.target.value || null })}
        className="rounded border border-line bg-surface px-2 py-1.5 text-xs text-ink focus:border-accent-text focus:outline-none"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange({ from: null, to: null })}
          title="Clear date range"
          aria-label="Clear date range"
          className="rounded p-1.5 text-ink-muted transition-colors hover:bg-canvas hover:text-ink"
        >
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  );
}
