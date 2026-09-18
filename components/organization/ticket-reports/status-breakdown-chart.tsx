"use client";

import { Fragment, useState } from "react";
import type { StatusBreakdownRow } from "@/lib/helper/ticket-reports";

interface StatusBreakdownChartProps {
  rows: StatusBreakdownRow[];
}

export function StatusBreakdownChart({ rows }: StatusBreakdownChartProps) {
  const [hoveredTagId, setHoveredTagId] = useState<number | null>(null);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = Math.max(...rows.map((r) => r.count), 1);

  if (rows.length === 0) {
    return <p className="text-sm text-ink-muted">No tickets yet.</p>;
  }

  return (
    <div>
      <div
        className="grid items-center gap-x-3 gap-y-3"
        style={{ gridTemplateColumns: "88px 1fr 32px" }}
      >
        {rows.map((row, i) => {
          const pct = (row.count / max) * 100;
          const hovered = hoveredTagId === row.tagId;

          return (
            <Fragment key={row.tagId}>
              <span
                className="truncate text-right text-xs text-ink-muted"
                title={row.tagName}
              >
                {row.tagName}
              </span>

              <div
                className="relative h-6"
                style={{ gridColumn: 2, gridRow: i + 1 }}
                onMouseEnter={() => setHoveredTagId(row.tagId)}
                onMouseLeave={() => setHoveredTagId(null)}
              >
                {/* Recessive vertical gridlines, shared scale reference */}
                <div className="pointer-events-none absolute inset-0 grid grid-cols-4">
                  {[0, 1, 2, 3].map((col) => (
                    <div key={col} className="border-l border-line" />
                  ))}
                </div>

                <div
                  className="h-6 rounded-r-sm transition-[filter] duration-100"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: row.color,
                    filter: hovered ? "brightness(0.92)" : undefined,
                  }}
                />

                {hovered && (
                  <div
                    className="pointer-events-none absolute -top-8 z-10 whitespace-nowrap rounded border border-line bg-ink px-2 py-1 text-xs text-surface shadow-sm"
                    style={
                      pct > 70
                        ? { right: `calc(${100 - pct}% + 4px)` }
                        : { left: `calc(${pct}% + 4px)` }
                    }
                  >
                    {row.tagName}: {row.count} (
                    {total ? Math.round((row.count / total) * 100) : 0}%)
                  </div>
                )}
              </div>

              <span className="text-right text-xs tabular-nums text-ink">
                {row.count}
              </span>
            </Fragment>
          );
        })}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
          View as table
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="py-1.5 font-medium">Status</th>
              <th className="py-1.5 text-right font-medium">Tickets</th>
              <th className="py-1.5 text-right font-medium">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.tagId} className="border-b border-line last:border-0">
                <td className="py-1.5 text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.tagName}
                  </span>
                </td>
                <td className="py-1.5 text-right tabular-nums text-ink">
                  {row.count}
                </td>
                <td className="py-1.5 text-right tabular-nums text-ink-muted">
                  {total ? Math.round((row.count / total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
