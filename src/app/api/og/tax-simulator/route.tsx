import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import {
  formatDollarTick,
  niceRange,
  niceTicks,
} from "@/components/tax-simulator/chartScale";
import { planColor } from "@/components/tax-simulator/planColors";
import { formatWholeDollars } from "@/lib/format";
import {
  buildRateCurve,
  chartMaxIncome,
  compareScenario,
  parseScenario,
  type PlanResult,
  inProvince,
  type RateCurvePoint,
  scenarioHasChanges,
  SCENARIO_TEXT,
  type ScenarioLang,
  scenarioTitle,
  toScenarioLang,
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

const PAD = { top: 40, side: 56, bottom: 30 };
const CONTENT_W = WIDTH - PAD.side * 2;
// Chart card: inner padding and the gutter for y-axis labels
const CARD_PAD = 22;
const Y_GUTTER = 72;
const X_AXIS_H = 30;

// Fonts and logo are read once per server instance and reused across
// requests, keeping cold renders fast for social crawlers.
let assetsPromise: ReturnType<typeof readAssets> | null = null;
function loadAssets() {
  assetsPromise ??= readAssets().catch((error) => {
    assetsPromise = null; // retry on the next request
    throw error;
  });
  return assetsPromise;
}

async function readAssets() {
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
        width: 26,
        height: 0,
        flexShrink: 0,
        borderTop: `${index === 0 ? 3 : 5}px ${
          index === 0 ? "dashed" : "solid"
        } ${planColor(index)}`,
      }}
    />
  );
}

/**
 * Full-width chart. "difference": each plan's tax minus plan A's (plan A is
 * the dashed zero line). "total": tax paid, used when there's nothing to
 * compare.
 */
function Chart({
  points,
  maxIncome,
  income,
  seriesCount,
  mode,
  width,
  height,
}: {
  points: RateCurvePoint[];
  maxIncome: number;
  income: number;
  seriesCount: number;
  mode: "difference" | "total";
  width: number;
  height: number;
}) {
  const series = Array.from({ length: seriesCount }, (_, s) => s);
  const value = (p: RateCurvePoint, s: number) =>
    mode === "total" ? p.taxes[s] : p.taxes[s] - p.taxes[0];
  const values = points.flatMap((p) => series.map((s) => value(p, s)));
  const scale =
    mode === "total"
      ? { min: 0, ...niceTicks(Math.max(...values), 4) }
      : niceRange(Math.min(...values), Math.max(...values), 4);
  const x = (v: number) => (v / maxIncome) * width;
  const y = (v: number) =>
    height - ((v - scale.min) / (scale.max - scale.min)) * height;
  const path = (s: number) =>
    points
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${x(p.income).toFixed(1)},${y(value(p, s)).toFixed(1)}`,
      )
      .join(" ");
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxIncome);
  const markerX = x(Math.min(income, maxIncome));
  const nearest = points.reduce((best, p) =>
    Math.abs(p.income - income) < Math.abs(best.income - income) ? p : best,
  );

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: width + Y_GUTTER,
        height: height + X_AXIS_H,
      }}
    >
      {scale.ticks.map((tick) => (
        <div
          key={tick}
          style={{
            position: "absolute",
            left: 0,
            top: y(tick) - 10,
            width: Y_GUTTER - 12,
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
            top: height + 10,
            left: Y_GUTTER + x(tick) - (i === 0 ? 0 : i === 4 ? 90 : 45),
            width: 90,
            display: "flex",
            justifyContent:
              i === 0 ? "flex-start" : i === 4 ? "flex-end" : "center",
            fontFamily: "Mono",
            fontSize: 16,
            color: COLORS.subtle,
          }}
        >
          {formatDollarTick(tick)}
        </div>
      ))}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", left: Y_GUTTER, top: 0 }}
      >
        {scale.ticks.map((tick) => (
          <line
            key={tick}
            x1={0}
            x2={width}
            y1={y(tick)}
            y2={y(tick)}
            stroke={
              tick === 0 && mode === "difference" ? "#cbbcae" : COLORS.grid
            }
            strokeWidth={1.5}
          />
        ))}
        <line
          x1={markerX}
          x2={markerX}
          y1={0}
          y2={height}
          stroke={COLORS.subtle}
          strokeWidth={1.5}
          strokeDasharray="4 6"
        />
        {series.map((s) => (
          <path
            key={s}
            d={path(s)}
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
            cy={y(value(nearest, s))}
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

/** One card per plan: total tax and the difference from plan A. */
function PlanStat({
  plan,
  index,
  count,
  noChange,
}: {
  plan: PlanResult;
  index: number;
  count: number;
  noChange: string;
}) {
  const { fg, bg } = deltaColors(plan.difference);
  const diff = Math.round(plan.difference);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: COLORS.card,
        border: `2px solid ${COLORS.border}`,
        padding: "12px 18px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LegendLine index={index} />
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: COLORS.muted,
            whiteSpace: "nowrap",
          }}
        >
          {truncate(plan.label, count > 3 ? 18 : count > 2 ? 26 : 34)}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 6,
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Display",
            fontSize: count > 3 ? 28 : 36,
            color: COLORS.foreground,
            lineHeight: 1,
          }}
        >
          {formatWholeDollars(plan.result.totalTax)}
        </div>
        {index > 0 && (
          <div
            style={{
              display: "flex",
              fontFamily: "Display",
              fontSize: count > 3 ? 16 : 22,
              color: fg,
              background: bg,
              padding: count > 3 ? "4px 9px" : "4px 12px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {diff === 0 ? noChange : signedDollars(diff)}
          </div>
        )}
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scenario = parseScenario(searchParams);
  const lang: ScenarioLang = toScenarioLang(
    searchParams.get("lang") ?? undefined,
  );
  const text = SCENARIO_TEXT[lang];
  const comparison = compareScenario(scenario, lang);
  if (!comparison) {
    return new Response("Unsupported year or province", { status: 400 });
  }
  const { fonts, logo } = await loadAssets();

  const { plans, reference } = comparison;
  const changed = scenarioHasChanges(scenario);
  const mode = plans.length > 1 && changed ? "difference" : "total";
  const maxIncome = chartMaxIncome(scenario.income);
  const points = buildRateCurve(comparison, maxIncome, 80);
  const title = scenarioTitle(scenario, lang);

  // Small logo in the bottom-right corner (logo-full.svg is 433 × 133), so
  // the title gets the full width
  const LOGO_W = 120;
  const LOGO_H = Math.round((LOGO_W * 133) / 433);
  const TITLE_W = CONTENT_W;
  // Size the title to fit one line (Söhne averages about 0.47em per
  // character), between 38px and 52px; very long titles wrap to two lines.
  const EM_PER_CHAR = 0.47;
  const titleSize = Math.max(
    38,
    Math.min(52, Math.floor(TITLE_W / (title.length * EM_PER_CHAR))),
  );
  const titleLines = Math.min(
    2,
    Math.ceil((title.length * titleSize * EM_PER_CHAR) / TITLE_W),
  );

  // "A person earning $400,000 in British Columbia would pay…" (the
  // province is left out when plans span several provinces)
  const provinces = new Set(plans.map((p) => p.plan.province));
  const where =
    provinces.size === 1 ? inProvince(plans[0].plan.province, lang) : "";
  const subtitle = text.wouldPay(formatWholeDollars(scenario.income), where);

  // Fit the chart into the space left below the header, title and stats
  const TITLE_H = Math.max(48, titleLines * titleSize * 1.05);
  const SUBTITLE_H = 32;
  const STATS_H = 96;
  const FOOTER_H = LOGO_H;
  const GAPS = 8 + 18 + 16 + 14;
  const CHART_HEADER_H = 30;
  const chartCardH =
    HEIGHT -
    PAD.top -
    PAD.bottom -
    TITLE_H -
    SUBTITLE_H -
    STATS_H -
    FOOTER_H -
    GAPS;
  const plotH = Math.max(
    80,
    chartCardH - CARD_PAD * 2 - CHART_HEADER_H - X_AXIS_H,
  );
  const plotW = CONTENT_W - CARD_PAD * 2 - Y_GUTTER;

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          background: COLORS.background,
          padding: `${PAD.top}px ${PAD.side}px ${PAD.bottom}px`,
          fontFamily: "Serif",
          color: COLORS.foreground,
        }}
      >
        {/* Title and subtitle */}
        <div style={{ display: "flex" }}>
          <div
            style={{ display: "flex", flexDirection: "column", width: TITLE_W }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "Display",
                fontSize: titleSize,
                lineHeight: 1.05,
                letterSpacing: -1,
                height: TITLE_H,
                overflow: "hidden",
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 8,
                height: SUBTITLE_H,
                fontSize: 26,
                color: COLORS.muted,
              }}
            >
              {subtitle}
            </div>
          </div>
        </div>

        {/* Plan totals */}
        <div
          style={{ display: "flex", gap: 14, marginTop: 18, height: STATS_H }}
        >
          {plans.map((p, i) => (
            <PlanStat
              key={i}
              plan={p}
              index={i}
              count={plans.length}
              noChange={text.noChange}
            />
          ))}
        </div>

        {/* Full-width chart */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 16,
            height: chartCardH,
            background: COLORS.card,
            border: `2px solid ${COLORS.border}`,
            padding: CARD_PAD,
          }}
        >
          <div
            style={{
              display: "flex",
              height: CHART_HEADER_H,
              fontFamily: "Mono",
              fontSize: 16,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COLORS.muted,
              marginLeft: Y_GUTTER,
            }}
          >
            {mode === "difference"
              ? text.differenceFrom(truncate(reference.label, 30))
              : text.taxPaidByIncome}
          </div>
          <Chart
            points={points}
            maxIncome={maxIncome}
            income={scenario.income}
            seriesCount={plans.length}
            mode={mode}
            width={plotW}
            height={plotH}
          />
        </div>

        {/* Disclosure (scenarios are user-made), and the logo bottom-right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            marginTop: 14,
            height: FOOTER_H,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 15,
              lineHeight: 1.25,
              color: COLORS.muted,
            }}
          >
            {text.disclosure}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={LOGO_W} height={LOGO_H} alt="" />
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
