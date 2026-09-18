"use client";

import { useRef, useState } from "react";
import type { CreatedTrendPoint } from "@/lib/helper/ticket-reports";

interface CreatedTrendChartProps {
  points: CreatedTrendPoint[];
}

const WIDTH = 600;
const HEIGHT = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

function formatShortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function CreatedTrendChart({ points }: CreatedTrendChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return <p className="text-sm text-ink-muted">No tickets yet.</p>;
  }

  const max = Math.max(...points.map((p) => p.count), 1);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xAt = (i: number) =>
    points.length === 1 ? 0 : (i / (points.length - 1)) * WIDTH;
  const yAt = (count: number) =>
    PAD_TOP + plotHeight - (count / max) * plotHeight;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.count)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xAt(points.length - 1)} ${
    PAD_TOP + plotHeight
  } L ${xAt(0)} ${PAD_TOP + plotHeight} Z`;

  const tickIndexes = Array.from(
    new Set([
      0,
      Math.round((points.length - 1) * 0.25),
      Math.round((points.length - 1) * 0.5),
      Math.round((points.length - 1) * 0.75),
      points.length - 1,
    ]),
  );

  const last = points[points.length - 1];

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const i = Math.round((relX / WIDTH) * (points.length - 1));
    setHoverIndex(Math.min(Math.max(i, 0), points.length - 1));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xAt(hoverIndex) : 0;
  const tooltipLeft =
    hoverIndex !== null ? `${(hoverX / WIDTH) * 100}%` : "0%";
  const tooltipAlign =
    hoverIndex !== null && hoverIndex > points.length * 0.7
      ? "translate-x-[-100%]"
      : "";

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Recessive horizontal gridlines */}
          {[0, 0.5, 1].map((frac) => (
            <line
              key={frac}
              x1={0}
              x2={WIDTH}
              y1={PAD_TOP + plotHeight * frac}
              y2={PAD_TOP + plotHeight * frac}
              stroke="#DCE3E0"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={areaPath} fill="#32CD32" fillOpacity={0.1} stroke="none" />
          <path
            d={linePath}
            fill="none"
            stroke="#32CD32"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Endpoint marker, always labeled */}
          <circle
            cx={xAt(points.length - 1)}
            cy={yAt(last.count)}
            r={4}
            fill="#32CD32"
            stroke="#FFFFFF"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />

          {hoverIndex !== null && (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={PAD_TOP}
                y2={PAD_TOP + plotHeight}
                stroke="#5B6B65"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={hoverX}
                cy={yAt(points[hoverIndex].count)}
                r={4}
                fill="#32CD32"
                stroke="#FFFFFF"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>

        {/* Endpoint value label */}
        <div
          className="pointer-events-none absolute -top-1 whitespace-nowrap text-xs font-medium text-ink"
          style={{
            left: `${(xAt(points.length - 1) / WIDTH) * 100}%`,
            transform: "translate(-100%, -100%)",
          }}
        >
          {last.count} today
        </div>

        {hovered && (
          <div
            className={`pointer-events-none absolute top-0 z-10 rounded border border-line bg-ink px-2 py-1 text-xs whitespace-nowrap text-surface shadow-sm ${tooltipAlign}`}
            style={{ left: tooltipLeft }}
          >
            {formatShortDate(hovered.date)}: {hovered.count} created
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-ink-muted">
        {tickIndexes.map((i) => (
          <span key={i}>{formatShortDate(points[i].date)}</span>
        ))}
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-ink-muted hover:text-ink">
          View as table
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 text-right font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date} className="border-b border-line last:border-0">
                <td className="py-1.5 text-ink">{formatShortDate(p.date)}</td>
                <td className="py-1.5 text-right tabular-nums text-ink">
                  {p.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
