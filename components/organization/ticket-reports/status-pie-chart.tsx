"use client";

import { useState } from "react";
import type { StatusBreakdownRow } from "@/lib/helper/ticket-reports";

const SIZE = 160;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEG = 2;

interface StatusPieChartProps {
  rows: StatusBreakdownRow[];
}

export function StatusPieChart({ rows }: StatusPieChartProps) {
  const [hoveredTagId, setHoveredTagId] = useState<number | null>(null);
  const total = rows.reduce((sum, r) => sum + r.count, 0);

  if (total === 0) {
    return <p className="text-sm text-ink-muted">No tickets yet.</p>;
  }

  const gapLength = (GAP_DEG / 360) * CIRCUMFERENCE;
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
      <div className="relative shrink-0">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {rows.map((row) => {
              const share = row.count / total;
              const length = Math.max(share * CIRCUMFERENCE - gapLength, 0);
              const offset = -cumulative;
              cumulative += share * CIRCUMFERENCE;
              const isHovered = hoveredTagId === row.tagId;

              return (
                <circle
                  key={row.tagId}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={row.color}
                  strokeWidth={isHovered ? STROKE + 4 : STROKE}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={offset}
                  onMouseEnter={() => setHoveredTagId(row.tagId)}
                  onMouseLeave={() => setHoveredTagId(null)}
                  style={{ transition: "stroke-width 0.1s ease" }}
                  className="cursor-pointer"
                />
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-semibold text-ink">{total}</p>
          <p className="text-xs text-ink-faint">tickets</p>
        </div>
      </div>

      {/* Every slice is directly labeled here with its name, count, and
          share — this palette has adjacent colors that fail colorblind and
          normal-vision separation checks, so color alone can't carry
          identity (see the dataviz skill's palette validator). */}
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li
            key={row.tagId}
            className={`flex items-center gap-2 rounded px-1.5 py-0.5 text-sm transition-colors ${
              hoveredTagId === row.tagId ? "bg-canvas" : ""
            }`}
            onMouseEnter={() => setHoveredTagId(row.tagId)}
            onMouseLeave={() => setHoveredTagId(null)}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-ink">{row.tagName}</span>
            <span className="text-ink-faint">
              {row.count} ({Math.round((row.count / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
