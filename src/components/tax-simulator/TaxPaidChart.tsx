"use client";

import { useMemo, useState } from "react";
import { Trans } from "@lingui/react/macro";

import { formatWholeDollars, RateCurvePoint } from "@/lib/tax";

import { formatDollarTick, niceTicks } from "./chartScale";
import { planColor } from "./planColors";

const WIDTH = 760;
const HEIGHT = 320;
const MARGIN = { top: 16, right: 16, bottom: 36, left: 64 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

function signed(amount: number) {
  const rounded = Math.round(amount);
  return `${rounded >= 0 ? "+" : "−"}${formatWholeDollars(Math.abs(rounded))}`;
}

interface TaxPaidChartProps {
  points: RateCurvePoint[];
  labels: string[];
  maxIncome: number;
  income: number;
}

/**
 * Total tax paid (y) by income (x), one line per plan.
 */
export function TaxPaidChart({
  points,
  labels,
  maxIncome,
  income,
}: TaxPaidChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const seriesCount = labels.length;

  const { x, y, yTicks, xTicks, paths } = useMemo(() => {
    const yScale = niceTicks(Math.max(...points.flatMap((p) => p.taxes)));
    const x = (v: number) => MARGIN.left + (v / maxIncome) * PLOT_W;
    const y = (v: number) => MARGIN.top + PLOT_H - (v / yScale.max) * PLOT_H;
    const paths = Array.from({ length: seriesCount }, (_, s) =>
      points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${x(p.income).toFixed(1)},${y(p.taxes[s]).toFixed(1)}`,
        )
        .join(" "),
    );
    return {
      x,
      y,
      yTicks: yScale.ticks,
      xTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxIncome),
      paths,
    };
  }, [points, maxIncome, seriesCount]);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const markerIncome = Math.min(income, maxIncome);
  const nearest = points.reduce((best, p) =>
    Math.abs(p.income - markerIncome) < Math.abs(best.income - markerIncome)
      ? p
      : best,
  );

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (svgX - MARGIN.left) / PLOT_W;
    const index = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  // Draw the reference (plan A) first so the other plans sit on top of it
  const order = Array.from({ length: seriesCount }, (_, i) => i);

  return (
    <figure className="m-0">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-foreground/70 mb-3">
        {labels.map((label, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <svg width="24" height="4" aria-hidden>
              <line
                x1="0"
                x2="24"
                y1="2"
                y2="2"
                stroke={planColor(i)}
                strokeWidth={i === 0 ? 2 : 3}
                strokeDasharray={i === 0 ? "5 4" : undefined}
              />
            </svg>
            {label}
          </span>
        ))}
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto touch-none select-none"
          role="img"
          aria-label={`Total tax paid by income: ${labels.join(", ")}`}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                className="text-foreground/10"
              />
              <text
                x={MARGIN.left - 8}
                y={y(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-foreground/50 text-[14px] font-mono"
              >
                {formatDollarTick(tick)}
              </text>
            </g>
          ))}
          {xTicks.map((tick, i) => (
            <text
              key={tick}
              x={x(tick)}
              y={HEIGHT - 10}
              textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}
              className="fill-foreground/50 text-[14px] font-mono"
            >
              {formatDollarTick(tick)}
            </text>
          ))}

          {/* Your income */}
          <line
            x1={x(markerIncome)}
            x2={x(markerIncome)}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_H}
            stroke="currentColor"
            strokeDasharray="3 5"
            className="text-foreground/40"
          />

          {order.map((s) => (
            <path
              key={s}
              d={paths[s]}
              fill="none"
              stroke={planColor(s)}
              strokeWidth={s === 0 ? 2 : 2.5}
              strokeDasharray={s === 0 ? "6 5" : undefined}
              strokeLinejoin="round"
            />
          ))}

          {order.map((s) => (
            <circle
              key={s}
              cx={x(markerIncome)}
              cy={y(nearest.taxes[s])}
              r={s === 0 ? 4.5 : 5}
              fill={s === 0 ? "var(--color-card)" : planColor(s)}
              stroke={s === 0 ? planColor(0) : "var(--color-card)"}
              strokeWidth={2}
            />
          ))}

          {hovered && (
            <g pointerEvents="none">
              <line
                x1={x(hovered.income)}
                x2={x(hovered.income)}
                y1={MARGIN.top}
                y2={MARGIN.top + PLOT_H}
                stroke="currentColor"
                className="text-foreground/30"
              />
              {order.map((s) => (
                <circle
                  key={s}
                  cx={x(hovered.income)}
                  cy={y(hovered.taxes[s])}
                  r={4}
                  fill={planColor(s)}
                />
              ))}
            </g>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-52 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md"
            style={
              x(hovered.income) > WIDTH / 2
                ? { right: `${(1 - x(hovered.income) / WIDTH) * 100 + 2}%` }
                : { left: `${(x(hovered.income) / WIDTH) * 100 + 2}%` }
            }
          >
            <div className="font-semibold mb-1">
              <Trans>Income {formatWholeDollars(hovered.income)}</Trans>
            </div>
            {labels.map((label, s) => (
              <div key={s} className="flex justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 text-foreground/70">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ background: planColor(s) }}
                  />
                  {label}
                </span>
                <span className="tabular-nums">
                  {formatWholeDollars(hovered.taxes[s])}
                  <span className="text-foreground/50 ml-1">
                    {hovered.rates[s].toFixed(1)}%
                  </span>
                  {s > 0 && (
                    <span className="text-foreground/50 ml-1">
                      ({signed(hovered.taxes[s] - hovered.taxes[0])})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
