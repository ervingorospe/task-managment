"use client";

import { useRef, useState } from "react";
import type { TrendSeries } from "@/lib/helper/ticket-reports";

interface TrendLineChartProps {
  series: TrendSeries[];
  emptyMessage?: string;
}

const WIDTH = 600;
const HEIGHT = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;
const TICK_COUNT = 5;

export function TrendLineChart({
  series,
  emptyMessage = "No data yet.",
}: TrendLineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const visibleSeries = series.filter((s) => s.points.length > 0);

  if (visibleSeries.length === 0) {
    return <p className="text-sm text-ink-muted">{emptyMessage}</p>;
  }

  const allX = visibleSeries.flatMap((s) => s.points.map((p) => p.x));
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const maxY = Math.max(...visibleSeries.flatMap((s) => s.points.map((p) => p.y)), 1);
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const xAt = (x: number) =>
    maxX === minX ? 0 : ((x - minX) / (maxX - minX)) * WIDTH;
  const yAt = (y: number) => PAD_TOP + plotHeight - (y / maxY) * plotHeight;

  const showLegend = visibleSeries.length > 1;
  const showEndLabels = visibleSeries.length <= 2;
  const showArea = visibleSeries.length === 1;

  const tickXs = Array.from({ length: TICK_COUNT }, (_, i) =>
    Math.round(minX + ((maxX - minX) * i) / (TICK_COUNT - 1)),
  );

  function labelFor(x: number): string {
    for (const s of visibleSeries) {
      const point = s.points.find((p) => p.x === x);
      if (point) return point.xLabel;
    }
    return String(x);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const domainX = minX + (relX / WIDTH) * (maxX - minX);
    setHoverX(Math.min(Math.max(Math.round(domainX), minX), maxX));
  }

  const hoverEntries =
    hoverX !== null
      ? visibleSeries
          .map((s) => ({
            series: s,
            point: s.points.find((p) => p.x === hoverX),
          }))
          .filter((e): e is { series: TrendSeries; point: NonNullable<(typeof e)["point"]> } =>
            Boolean(e.point),
          )
      : [];

  const hoverLeftPct = hoverX !== null ? (xAt(hoverX) / WIDTH) * 100 : 0;
  const tooltipAlign =
    hoverX !== null && xAt(hoverX) > WIDTH * 0.65 ? "translate-x-[-100%]" : "";

  return (
    <div>
      {showLegend && (
        <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
          {visibleSeries.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 text-xs text-ink-muted"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-40 w-full"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverX(null)}
        >
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

          {visibleSeries.map((s) => {
            const linePath = s.points
              .map(
                (p, i) => `${i === 0 ? "M" : "L"} ${xAt(p.x)} ${yAt(p.y)}`,
              )
              .join(" ");
            const areaPath = showArea
              ? `${linePath} L ${xAt(s.points[s.points.length - 1].x)} ${
                  PAD_TOP + plotHeight
                } L ${xAt(s.points[0].x)} ${PAD_TOP + plotHeight} Z`
              : null;
            const last = s.points[s.points.length - 1];

            return (
              <g key={s.id}>
                {areaPath && (
                  <path d={areaPath} fill={s.color} fillOpacity={0.1} stroke="none" />
                )}
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                <circle
                  cx={xAt(last.x)}
                  cy={yAt(last.y)}
                  r={4}
                  fill={s.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}

          {hoverX !== null && (
            <line
              x1={xAt(hoverX)}
              x2={xAt(hoverX)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="#5B6B65"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {hoverEntries.map(({ series: s, point }) => (
            <circle
              key={s.id}
              cx={xAt(point.x)}
              cy={yAt(point.y)}
              r={4}
              fill={s.color}
              stroke="#FFFFFF"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {showEndLabels &&
          visibleSeries.map((s) => {
            const last = s.points[s.points.length - 1];
            return (
              <div
                key={s.id}
                className="pointer-events-none absolute -top-1 whitespace-nowrap text-xs font-medium text-ink"
                style={{
                  left: `${(xAt(last.x) / WIDTH) * 100}%`,
                  transform: "translate(-100%, -100%)",
                }}
              >
                {last.y}
              </div>
            );
          })}

        {hoverEntries.length > 0 && (
          <div
            className={`pointer-events-none absolute top-0 z-10 rounded border border-line bg-ink px-2 py-1 text-xs whitespace-nowrap text-surface shadow-sm ${tooltipAlign}`}
            style={{ left: `${hoverLeftPct}%` }}
          >
            <div className="font-medium">{labelFor(hoverX!)}</div>
            {hoverEntries.map(({ series: s, point }) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}: {point.y}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-1.5 flex justify-between text-xs text-ink-muted">
        {tickXs.map((x, i) => (
          <span key={i}>{labelFor(x)}</span>
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
              {visibleSeries.map((s) => (
                <th key={s.id} className="py-1.5 text-right font-medium">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxX - minX + 1 }, (_, i) => minX + i).map(
              (x) => (
                <tr key={x} className="border-b border-line last:border-0">
                  <td className="py-1.5 text-ink">{labelFor(x)}</td>
                  {visibleSeries.map((s) => (
                    <td
                      key={s.id}
                      className="py-1.5 text-right tabular-nums text-ink"
                    >
                      {s.points.find((p) => p.x === x)?.y ?? "—"}
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </details>
    </div>
  );
}
