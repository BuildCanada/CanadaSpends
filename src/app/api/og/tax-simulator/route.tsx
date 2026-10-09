import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import {
  formatDollarTick,
  niceTicks,
} from "@/components/tax-simulator/chartScale";
import { planColor } from "@/components/tax-simulator/planColors";
import {
  buildRateCurve,
  chartMaxIncome,
  compareScenario,
  defaultScenarioTitle,
  formatWholeDollars,
  parseScenario,
  type PlanResult,
  PROVINCE_NAMES,
  type RateCurvePoint,
  scenarioHasChanges,
} from "@/lib/tax";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  background: "#f6ece3", // linen-100
  card: "#fbf6f1", // linen-50
  border: "#ead2be", // linen-200
  foreground: "#272727", // charcoal-1000
  muted: "#5d5d5d", // charcoal-600
  subtle: "#888888", // charcoal-400
  grid: "#e2d5c8",
  primary: "#932f2f", // auburn-800
  increase: "#a43131", // auburn-700
  increaseBg: "#fae6e6", // auburn-100
  decrease: "#2a5236", // pine-700
  decreaseBg: "#dfece0", // pine-100
};

const CHART = { width: 396, height: 368 };

async function loadAssets() {
  const root = process.cwd();
  const [display, serif, mono, logo] = await Promise.all([
    readFile(join(root, "src/assets/fonts/soehne-kraftig.ttf")),
    readFile(join(root, "src/assets/fonts/financier-text-regular.ttf")),
    readFile(join(root, "src/assets/fonts/founders-grotesk-mono-regular.ttf")),
    readFile(join(root, "src/components/MainLayout/logo-full.svg")),
  ]);
  return {
    fonts: [
      { name: "Display", data: display, weight: 500 as const },
      { name: "Serif", data: serif, weight: 400 as const },
      { name: "Mono", data: mono, weight: 400 as const },
    ],
    // Vector logo (same as the site header) so it stays crisp at small sizes
    logo: `data:image/svg+xml;base64,${logo.toString("base64")}`,
  };
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function signedDollars(amount: number) {
  const rounded = Math.round(amount);
  if (rounded === 0) return "±$0";
  return `${rounded < 0 ? "−" : "+"}${formatWholeDollars(Math.abs(rounded))}`;
}

function deltaColors(amount: number) {
  const rounded = Math.round(amount);
  if (rounded < 0) return { fg: COLORS.decrease, bg: COLORS.decreaseBg };
  if (rounded > 0) return { fg: COLORS.increase, bg: COLORS.increaseBg };
  return { fg: COLORS.muted, bg: COLORS.card };
}

function LegendLine({ index }: { index: number }) {
  return (
    <div
      style={{
        width: 28,
        height: 0,
        flexShrink: 0,
        borderTop: `${index === 0 ? 3 : 5}px ${
          index === 0 ? "dashed" : "solid"
        } ${planColor(index)}`,
      }}
    />
  );
}

function RateChart({
  points,
  maxIncome,
  income,
  seriesCount,
}: {
  points: RateCurvePoint[];
  maxIncome: number;
  income: number;
  seriesCount: number;
}) {
  const yScale = niceTicks(Math.max(...points.flatMap((p) => p.taxes)), 4);
  const x = (v: number) => (v / maxIncome) * CHART.width;
  const y = (v: number) => CHART.height - (v / yScale.max) * CHART.height;
  const path = (s: number) =>
    points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.income).toFixed(1)},${y(p.taxes[s]).toFixed(1)}`,
      )
      .join(" ");

  const series = Array.from({ length: seriesCount }, (_, s) => s);
  const paths = series.map(path);
  // With exactly two plans, shade the gap between them
  const band =
    seriesCount === 2
      ? paths[1] +
        " " +
        [...points]
          .reverse()
          .map((p) => `L${x(p.income).toFixed(1)},${y(p.taxes[0]).toFixed(1)}`)
          .join(" ") +
        " Z"
      : null;

  const yTicks = yScale.ticks;
  const xTicks = [0, maxIncome / 2, maxIncome];
  const markerX = x(Math.min(income, maxIncome));
  const nearest = points.reduce((best, p) =>
    Math.abs(p.income - income) < Math.abs(best.income - income) ? p : best,
  );

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: CHART.width + 64,
        height: CHART.height + 36,
      }}
    >
      {yTicks.map((tick) => (
        <div
          key={tick}
          style={{
            position: "absolute",
            left: 0,
            top: y(tick) - 10,
            width: 56,
            display: "flex",
            justifyContent: "flex-end",
            fontFamily: "Mono",
            fontSize: 16,
            color: COLORS.subtle,
          }}
        >
          {formatDollarTick(tick)}
        </div>
      ))}
      {xTicks.map((tick, i) => (
        <div
          key={tick}
          style={{
            position: "absolute",
            top: CHART.height + 12,
            left: 64 + x(tick) - (i === 0 ? 0 : i === 2 ? 80 : 40),
            width: 80,
            display: "flex",
            justifyContent:
              i === 0 ? "flex-start" : i === 2 ? "flex-end" : "center",
            fontFamily: "Mono",
            fontSize: 16,
            color: COLORS.subtle,
          }}
        >
          {formatDollarTick(tick)}
        </div>
      ))}
      <svg
        width={CHART.width}
        height={CHART.height}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        style={{ position: "absolute", left: 64, top: 0 }}
      >
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={CHART.width}
            y1={y(tick)}
            y2={y(tick)}
            stroke={COLORS.grid}
            strokeWidth={1.5}
          />
        ))}
        <line
          x1={markerX}
          x2={markerX}
          y1={0}
          y2={CHART.height}
          stroke={COLORS.subtle}
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        {band && <path d={band} fill={planColor(1)} fillOpacity={0.12} />}
        {series.map((s) => (
          <path
            key={s}
            d={paths[s]}
            fill="none"
            stroke={planColor(s)}
            strokeWidth={s === 0 ? 3 : 5}
            strokeDasharray={s === 0 ? "8 8" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {series.map((s) => (
          <circle
            key={s}
            cx={markerX}
            cy={y(nearest.taxes[s])}
            r={s === 0 ? 7 : 8}
            fill={s === 0 ? COLORS.card : planColor(s)}
            stroke={s === 0 ? planColor(0) : COLORS.card}
            strokeWidth={3}
          />
        ))}
      </svg>
    </div>
  );
}

function AmountBlock({ plan, index }: { plan: PlanResult; index: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", maxWidth: 250 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LegendLine index={index} />
        <div
          style={{
            fontSize: 22,
            color: COLORS.muted,
            whiteSpace: "nowrap",
          }}
        >
          {truncate(plan.label, 17)}
        </div>
      </div>
      <div
        style={{
          fontFamily: "Display",
          fontSize: 54,
          color: COLORS.foreground,
          marginTop: 6,
          lineHeight: 1,
        }}
      >
        {formatWholeDollars(plan.result.totalTax)}
      </div>
      <div
        style={{
          fontFamily: "Serif",
          fontSize: 22,
          color: COLORS.muted,
          marginTop: 8,
        }}
      >
        {`${plan.result.effectiveTaxRate.toFixed(1)}% effective rate`}
      </div>
    </div>
  );
}

/** Two plans: big side-by-side numbers and a difference pill. */
function TwoPlanSummary({ plans }: { plans: PlanResult[] }) {
  const [a, b] = plans;
  const diff = Math.round(b.difference);
  const { fg, bg } = deltaColors(diff);
  // Difference of the rounded rates, so it matches the two rates shown
  const rateChange =
    Math.round(b.result.effectiveTaxRate * 10) / 10 -
    Math.round(a.result.effectiveTaxRate * 10) / 10;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 40 }}>
        <AmountBlock plan={a} index={0} />
        <AmountBlock plan={b} index={1} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          marginTop: 22,
          background: bg,
          borderRadius: 20,
          padding: "16px 24px",
          alignSelf: "flex-start",
        }}
      >
        <div
          style={{
            fontFamily: "Display",
            fontSize: 44,
            color: fg,
            lineHeight: 1,
          }}
        >
          {diff === 0 ? "No change" : `${signedDollars(diff)} / year`}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 21,
            color: fg,
            maxWidth: 190,
            lineHeight: 1.2,
          }}
        >
          {diff === 0
            ? `Same as ${truncate(a.label, 20)}`
            : `${diff < 0 ? "less" : "more"} tax · ${
                rateChange >= 0 ? "+" : "−"
              }${Math.abs(rateChange).toFixed(1)} pts`}
        </div>
      </div>
    </div>
  );
}

/** Three or four plans: one row each, with the difference vs plan A. */
function PlanRows({ plans }: { plans: PlanResult[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {plans.map((p, i) => {
        const { fg, bg } = deltaColors(p.difference);
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              paddingBottom: 10,
              borderBottom:
                i < plans.length - 1 ? `1.5px solid ${COLORS.border}` : "none",
            }}
          >
            <LegendLine index={i} />
            <div
              style={{
                display: "flex",
                flex: 1,
                fontSize: 24,
                color: COLORS.foreground,
              }}
            >
              {truncate(p.label, 22)}
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Display",
                fontSize: 32,
                color: COLORS.foreground,
              }}
            >
              {formatWholeDollars(p.result.totalTax)}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: 120,
                fontFamily: "Display",
                fontSize: 20,
                color: i === 0 ? COLORS.subtle : fg,
                background: i === 0 ? "transparent" : bg,
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              {i === 0 ? "reference" : signedDollars(p.difference)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = parseScenario(searchParams);
  const comparison = compareScenario(scenario);
  const { fonts, logo } = await loadAssets();

  if (!comparison) {
    return new Response("Unsupported year or province", { status: 400 });
  }

  const { plans } = comparison;
  const maxIncome = chartMaxIncome(scenario.income);
  const points = buildRateCurve(comparison, maxIncome, 80);
  const title =
    scenario.title ||
    (scenarioHasChanges(scenario)
      ? defaultScenarioTitle(scenario)
      : "What would you change?");
  const titleSize = title.length > 48 ? 42 : title.length > 24 ? 52 : 64;

  const sameJurisdiction = plans.every(
    (p) =>
      p.plan.province === plans[0].plan.province &&
      p.plan.year === plans[0].plan.year,
  );
  const subtitle = sameJurisdiction
    ? `${formatWholeDollars(scenario.income)} income · ${
        PROVINCE_NAMES[plans[0].plan.province] ?? plans[0].plan.province
      } · ${plans[0].plan.year}`
    : `${formatWholeDollars(scenario.income)} income · ${plans.length} plans compared${
        plans.every((p) => p.plan.year === plans[0].plan.year)
          ? ` · ${plans[0].plan.year}`
          : ""
      }`;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: COLORS.background,
          padding: "44px 56px 36px",
          fontFamily: "Serif",
          color: COLORS.foreground,
        }}
      >
        <div style={{ display: "flex", flex: 1, gap: 40 }}>
          {/* Left: title and headline numbers */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 540,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} width={169} height={52} alt="" />
              <div
                style={{ width: 2, height: 32, background: COLORS.border }}
              />
              <div
                style={{
                  display: "flex",
                  fontFamily: "Mono",
                  fontSize: 18,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: COLORS.primary,
                }}
              >
                Tax Simulator
              </div>
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 30,
                fontFamily: "Display",
                fontSize: titleSize,
                lineHeight: 1.05,
                letterSpacing: -1,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 12,
                fontSize: 24,
                color: COLORS.muted,
              }}
            >
              {subtitle}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: "auto",
              }}
            >
              {plans.length === 1 ? (
                <AmountBlock plan={plans[0]} index={0} />
              ) : plans.length === 2 ? (
                <TwoPlanSummary plans={plans} />
              ) : (
                <PlanRows plans={plans} />
              )}
            </div>
          </div>

          {/* Right: effective rate chart */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              background: COLORS.card,
              border: `2px solid ${COLORS.border}`,
              borderRadius: 24,
              padding: "22px 22px 14px 12px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Mono",
                fontSize: 15,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: COLORS.muted,
                marginLeft: 64,
                marginBottom: 18,
              }}
            >
              Tax paid by income
            </div>
            <RateChart
              points={points}
              maxIncome={maxIncome}
              income={scenario.income}
              seriesCount={plans.length}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
            fontFamily: "Mono",
            fontSize: 16,
            color: COLORS.subtle,
          }}
        >
          <div style={{ display: "flex" }}>
            Income tax, CPP/QPP, EI and premiums · Estimates for employment
            income
          </div>
          <div style={{ display: "flex", color: COLORS.foreground }}>
            canadaspends.com
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts,
      headers: {
        // Cache for a day (not "immutable") so design fixes reach links
        // that have already been shared.
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
