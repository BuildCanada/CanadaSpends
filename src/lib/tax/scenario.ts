import { formatWholeDollars } from "../format";
import { provinceNames } from "../provinceNames";

import { calculateTaxWithConfig } from "./calculator";
import { provinceName, SCENARIO_TEXT, type ScenarioLang } from "./scenarioText";
import { getDefaultYear, getTaxConfig } from "./configs";
import {
  BracketTaxConfig,
  DetailedTaxCalculation,
  SupportedYear,
  TaxBracket,
  TaxYearProvinceConfig,
} from "./types";

/**
 * One set of tax rules for the current tax year: a province's current law,
 * optionally with proposed changes. Overrides are `null` / `false` when the
 * plan uses current law for that parameter, which keeps shared URLs short.
 */
export interface TaxPlan {
  province: string;
  year: SupportedYear;
  federalBrackets: TaxBracket[] | null;
  federalBpa: number | null;
  provincialBrackets: TaxBracket[] | null;
  provincialBpa: number | null;
  removeSurtax: boolean;
  removeHealthPremium: boolean;
}

/**
 * A comparison of plans at one income, always against current law:
 * - plan A is the reference: a province's current law for the current year
 * - plans in the same province are proposed changes to that law
 * - plans in other provinces are those provinces' current law
 * There are no user-written titles or names; labels and the title are
 * generated so shared scenarios stay neutral. Everything round-trips through
 * the URL query string.
 */
export interface TaxScenario {
  income: number;
  plans: TaxPlan[];
}

export const PROVINCE_NAMES = provinceNames;

// ISO 3166-2:CA codes, used in URLs
export const PROVINCE_TO_CODE: Record<string, string> = {
  alberta: "AB",
  "british-columbia": "BC",
  manitoba: "MB",
  "new-brunswick": "NB",
  "newfoundland-and-labrador": "NL",
  "northwest-territories": "NT",
  "nova-scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince-edward-island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

export const CODE_TO_PROVINCE: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_TO_CODE).map(([slug, code]) => [code, slug]),
);

export const DEFAULT_SCENARIO_INCOME = 100000;
export const DEFAULT_SCENARIO_PROVINCE = "ontario";
export const MAX_SCENARIO_BRACKETS = 10;
/** URL prefixes for each plan; the length is the maximum number of plans. */
export const PLAN_KEYS = ["a", "b", "c", "d"] as const;
export const MAX_PLANS = PLAN_KEYS.length;
export const MAX_SCENARIO_INCOME = 100_000_000;

/** The tax year every scenario uses: the current year. */
export const SCENARIO_YEAR: SupportedYear = getDefaultYear();

/** A province's current law for the current year. */
export function createPlan(
  province: string = DEFAULT_SCENARIO_PROVINCE,
): TaxPlan {
  return {
    province,
    year: SCENARIO_YEAR,
    federalBrackets: null,
    federalBpa: null,
    provincialBrackets: null,
    provincialBpa: null,
    removeSurtax: false,
    removeHealthPremium: false,
  };
}

/** Current law vs. an (initially unchanged) proposed change. */
export function createDefaultScenario(): TaxScenario {
  return {
    income: DEFAULT_SCENARIO_INCOME,
    plans: [createPlan(), createPlan()],
  };
}

// Round a decimal rate (0.145) to a percentage with at most 3 decimals (14.5),
// avoiding floating point noise like 14.499999999.
export function rateToPercent(rate: number): number {
  return Math.round(rate * 100 * 1000) / 1000;
}

export function percentToRate(percent: number): number {
  return Math.round(percent * 1000) / 100000;
}

/**
 * Encode brackets as `threshold-rate` pairs joined by `_`, with rates in
 * percent. e.g. `0-14.5_57375-20.5_114750-26`. Only URL-safe characters are
 * used so links stay readable.
 */
export function encodeBrackets(brackets: TaxBracket[]): string {
  return brackets
    .map((b) => `${Math.round(b.min)}-${rateToPercent(b.rate)}`)
    .join("_");
}

/**
 * Normalize a list of brackets: sort by threshold, drop duplicates, clamp
 * rates to [0, 100%], force the first bracket to start at $0, and derive each
 * bracket's `max` from the next bracket's `min`.
 */
export function normalizeBrackets(
  brackets: Array<Pick<TaxBracket, "min" | "rate">>,
): TaxBracket[] {
  const sorted = brackets
    .filter((b) => Number.isFinite(b.min) && Number.isFinite(b.rate))
    .map((b) => ({
      min: Math.max(0, Math.round(b.min)),
      rate: Math.min(1, Math.max(0, b.rate)),
    }))
    .sort((a, b) => a.min - b.min)
    .filter((b, i, arr) => i === 0 || b.min !== arr[i - 1].min)
    .slice(0, MAX_SCENARIO_BRACKETS);

  if (sorted.length === 0) return [];
  sorted[0].min = 0;

  return sorted.map((b, i) => ({
    min: b.min,
    max: i < sorted.length - 1 ? sorted[i + 1].min : null,
    rate: b.rate,
  }));
}

export function decodeBrackets(value: string | null | undefined) {
  if (!value) return null;
  const parsed = value.split("_").map((pair) => {
    const [min, rate] = pair.split("-");
    return { min: Number(min), rate: percentToRate(Number(rate)) };
  });
  const brackets = normalizeBrackets(parsed);
  return brackets.length > 0 ? brackets : null;
}

function bracketsEqual(a: TaxBracket[], b: TaxBracket[]): boolean {
  return encodeBrackets(a) === encodeBrackets(b);
}

type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function getParam(params: SearchParamsLike, key: string): string | null {
  if (params instanceof URLSearchParams) return params.get(key);
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

// Limits applied identically when writing and reading URLs, so a link always
// reproduces exactly the scenario it was made from (and the page's og:image
// matches the image the share buttons warm).
function limitAmount(n: number): number {
  return Math.min(Math.round(n), MAX_SCENARIO_INCOME);
}

function parseAmount(value: string | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return limitAmount(n);
}

function parseProvince(value: string | null): string | null {
  const code = value?.toUpperCase();
  return code && CODE_TO_PROVINCE[code] ? CODE_TO_PROVINCE[code] : null;
}

/**
 * Read one plan's settings. Keys are `<prefix>province`, `<prefix>fb`, etc.,
 * where the prefix is e.g. `b.` (or empty for legacy single-plan links).
 * Names, titles and years in older links are ignored.
 */
function parsePlan(
  params: SearchParamsLike,
  prefix: string,
  fallbackProvince: string,
): TaxPlan {
  const get = (key: string) => getParam(params, `${prefix}${key}`);
  return {
    province: parseProvince(get("province")) ?? fallbackProvince,
    year: SCENARIO_YEAR,
    federalBrackets: decodeBrackets(get("fb")),
    federalBpa: parseAmount(get("fbpa")),
    provincialBrackets: decodeBrackets(get("pb")),
    provincialBpa: parseAmount(get("pbpa")),
    removeSurtax: get("nosurtax") === "1",
    removeHealthPremium: get("nohp") === "1",
  };
}

function hasPlanParams(params: SearchParamsLike, key: string): boolean {
  const prefix = `${key}.`;
  if (params instanceof URLSearchParams) {
    return [...params.keys()].some((k) => k.startsWith(prefix));
  }
  return Object.keys(params).some((k) => k.startsWith(prefix));
}

/** Whether a plan is a proposed change to the reference province's law. */
export function isProposal(index: number, plans: TaxPlan[]): boolean {
  return index > 0 && plans[index].province === plans[0]?.province;
}

/**
 * Enforce the scenario rules: plan A is current law for the current year,
 * proposals edit the reference province's current-year law, and plans in
 * other provinces are their current law.
 */
export function normalizeScenario(scenario: TaxScenario): TaxScenario {
  const plans = scenario.plans.slice(0, MAX_PLANS);
  const reference = plans[0]?.province ?? DEFAULT_SCENARIO_PROVINCE;
  return {
    income: Math.max(1, limitAmount(scenario.income)),
    plans:
      plans.length === 0
        ? [createPlan(reference)]
        : plans.map((plan, i) =>
            isProposal(i, plans)
              ? { ...plan, year: SCENARIO_YEAR }
              : createPlan(plan.province),
          ),
  };
}

export function parseScenario(params: SearchParamsLike): TaxScenario {
  const scenario = createDefaultScenario();

  const income = parseAmount(getParam(params, "income"));
  if (income !== null && income > 0) scenario.income = income;

  if (hasPlanParams(params, PLAN_KEYS[0])) {
    // Plans are listed in order; stop at the first missing one.
    const plans: TaxPlan[] = [];
    for (const key of PLAN_KEYS) {
      if (!hasPlanParams(params, key)) break;
      plans.push(
        parsePlan(
          params,
          `${key}.`,
          plans[0]?.province ?? DEFAULT_SCENARIO_PROVINCE,
        ),
      );
    }
    scenario.plans = plans;
  } else {
    // Legacy single-plan links: unprefixed province/overrides describe a
    // proposal compared against current law in the same province.
    const legacy = parsePlan(params, "", DEFAULT_SCENARIO_PROVINCE);
    scenario.plans = [createPlan(legacy.province), legacy];
  }

  return normalizeScenario(scenario);
}

/**
 * Serialize a scenario to query params. Overrides that match current law are
 * omitted so the link only carries what was actually changed.
 */
export function serializeScenario(scenario: TaxScenario): URLSearchParams {
  const { income, plans } = normalizeScenario(scenario);
  const params = new URLSearchParams();
  params.set("income", String(income));

  plans.forEach((plan, i) => {
    const prefix = `${PLAN_KEYS[i]}.`;
    // Province is always written so each plan is present in the URL
    params.set(`${prefix}province`, PROVINCE_TO_CODE[plan.province] ?? "ON");
    for (const [key, value] of Object.entries(planOverrideParams(plan))) {
      params.set(`${prefix}${key}`, value);
    }
  });

  return params;
}

/** The plan's changes from current law, as URL params (unprefixed). */
export function planOverrideParams(plan: TaxPlan): Record<string, string> {
  const out: Record<string, string> = {};
  const base = getTaxConfig(plan.year, plan.province);
  const fed = base?.federal.incomeTax;
  const prov = base?.provincial.incomeTax;

  if (
    plan.federalBrackets &&
    (!fed || !bracketsEqual(plan.federalBrackets, fed.brackets))
  ) {
    out.fb = encodeBrackets(plan.federalBrackets);
  }
  if (
    plan.federalBpa !== null &&
    plan.federalBpa !== fed?.basicPersonalAmount
  ) {
    out.fbpa = String(limitAmount(plan.federalBpa));
  }
  if (
    plan.provincialBrackets &&
    (!prov || !bracketsEqual(plan.provincialBrackets, prov.brackets))
  ) {
    out.pb = encodeBrackets(plan.provincialBrackets);
  }
  if (
    plan.provincialBpa !== null &&
    plan.provincialBpa !== prov?.basicPersonalAmount
  ) {
    out.pbpa = String(limitAmount(plan.provincialBpa));
  }
  if (plan.removeSurtax && base?.provincial.surtax) out.nosurtax = "1";
  if (plan.removeHealthPremium && base?.provincial.healthPremium) {
    out.nohp = "1";
  }
  return out;
}

/**
 * The plan with only overrides that actually differ from current law (e.g.
 * a surtax toggle in a province without a surtax is dropped).
 */
export function effectivePlan(plan: TaxPlan): TaxPlan {
  const active = planOverrideParams(plan);
  return {
    ...plan,
    federalBrackets: "fb" in active ? plan.federalBrackets : null,
    federalBpa: "fbpa" in active ? plan.federalBpa : null,
    provincialBrackets: "pb" in active ? plan.provincialBrackets : null,
    provincialBpa: "pbpa" in active ? plan.provincialBpa : null,
    removeSurtax: "nosurtax" in active,
    removeHealthPremium: "nohp" in active,
  };
}

/** Whether the plan changes anything relative to its current law. */
export function planHasChanges(plan: TaxPlan): boolean {
  return Object.keys(planOverrideParams(plan)).length > 0;
}

/** Whether two plans describe the same rules. */
export function plansEquivalent(a: TaxPlan, b: TaxPlan): boolean {
  return (
    a.province === b.province &&
    a.year === b.year &&
    JSON.stringify(planOverrideParams(a)) ===
      JSON.stringify(planOverrideParams(b))
  );
}

/** Whether the scenario compares anything that actually differs. */
export function scenarioHasChanges(scenario: TaxScenario): boolean {
  const [reference, ...others] = scenario.plans;
  return others.some((plan) => !plansEquivalent(reference, plan));
}

/**
 * Neutral, generated label for a plan:
 * - current law (plan A and other provinces): "British Columbia 2026"
 * - simulated changes: "Simulated change", or "Simulated change 1", …
 */
export function planLabel(
  plan: TaxPlan,
  index: number,
  plans: TaxPlan[],
  lang: ScenarioLang = "en",
) {
  const text = SCENARIO_TEXT[lang];
  if (isProposal(index, plans)) {
    const proposals = plans
      .map((_, i) => i)
      .filter((i) => isProposal(i, plans));
    return proposals.length === 1
      ? text.simulatedChange
      : text.simulatedChangeN(proposals.indexOf(index) + 1);
  }
  return `${provinceName(plan.province, lang)} ${plan.year}`;
}

/**
 * The scenario's title, generated so shared links stay neutral:
 * "Simulated Tax Change: British Columbia".
 */
export function scenarioTitle(
  scenario: TaxScenario,
  lang: ScenarioLang = "en",
): string {
  const reference = scenario.plans[0]?.province ?? DEFAULT_SCENARIO_PROVINCE;
  return SCENARIO_TEXT[lang].title(provinceName(reference, lang));
}

/**
 * Apply a plan's overrides on top of the current-law configuration.
 */
export function applyPlan(
  config: TaxYearProvinceConfig,
  plan: TaxPlan,
): TaxYearProvinceConfig {
  const { surtax, healthPremium, ...provincialRest } = config.provincial;

  return {
    ...config,
    federal: {
      ...config.federal,
      incomeTax: withBasicPersonalAmount(
        {
          ...config.federal.incomeTax,
          brackets: plan.federalBrackets ?? config.federal.incomeTax.brackets,
        },
        plan.federalBpa,
      ),
    },
    provincial: {
      ...provincialRest,
      ...(surtax && !plan.removeSurtax ? { surtax } : {}),
      ...(healthPremium && !plan.removeHealthPremium ? { healthPremium } : {}),
      incomeTax: withBasicPersonalAmount(
        {
          ...config.provincial.incomeTax,
          brackets:
            plan.provincialBrackets ?? config.provincial.incomeTax.brackets,
        },
        plan.provincialBpa,
      ),
    },
  };
}

/**
 * A proposed basic personal amount is a flat amount for everyone: it
 * replaces current law's amount and any income-based phase-down of it.
 * An amount equal to current law's is no change (it's also left out of
 * links), so current law, phase-down included, still applies.
 */
function withBasicPersonalAmount(
  incomeTax: BracketTaxConfig,
  proposed: number | null,
): BracketTaxConfig {
  if (proposed === null || proposed === incomeTax.basicPersonalAmount) {
    return incomeTax;
  }
  const credits = incomeTax.credits
    ? { ...incomeTax.credits, bpaPhaseOut: undefined }
    : undefined;
  return { ...incomeTax, basicPersonalAmount: proposed, credits };
}

export interface PlanResult {
  plan: TaxPlan;
  label: string;
  /** Current law for the plan's province and year */
  baseConfig: TaxYearProvinceConfig;
  /** The plan's rules (current law with overrides applied) */
  config: TaxYearProvinceConfig;
  result: DetailedTaxCalculation;
  /** result.totalTax - reference totalTax (negative = pays less) */
  difference: number;
  /** Change in marginal rate vs the reference, in percentage points */
  marginalRateChange: number;
}

export interface ScenarioComparison {
  plans: PlanResult[];
  reference: PlanResult;
}

/**
 * Calculate every plan at the scenario's income. Plans whose province or
 * year isn't supported are dropped; returns null if none are left.
 */
export function compareScenario(
  scenario: TaxScenario,
  lang: ScenarioLang = "en",
): ScenarioComparison | null {
  const computed = scenario.plans.flatMap((plan, index) => {
    const baseConfig = getTaxConfig(plan.year, plan.province);
    if (!baseConfig) return [];
    const config = applyPlan(baseConfig, plan);
    return [
      {
        plan,
        label: planLabel(plan, index, scenario.plans, lang),
        baseConfig,
        config,
        result: calculateTaxWithConfig(scenario.income, config),
      },
    ];
  });
  if (computed.length === 0) return null;

  const ref = computed[0].result;
  const plans = computed.map((p) => ({
    ...p,
    difference: p.result.totalTax - ref.totalTax,
    marginalRateChange: p.result.marginalTaxRate - ref.marginalTaxRate,
  }));
  return { plans, reference: plans[0] };
}

export interface RateCurvePoint {
  income: number;
  /** Combined marginal rate per plan, in the same order as the comparison's plans */
  rates: number[];
  /** Total tax per plan */
  taxes: number[];
}

/**
 * Combined marginal tax rate for each plan across a range of incomes, for charting.
 */
export function buildRateCurve(
  comparison: Pick<ScenarioComparison, "plans">,
  maxIncome: number,
  steps = 60,
): RateCurvePoint[] {
  const points: RateCurvePoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const income = Math.max(1000, (maxIncome * i) / steps);
    const results = comparison.plans.map((p) =>
      calculateTaxWithConfig(income, p.config),
    );
    points.push({
      income,
      rates: results.map((r) => r.marginalTaxRate),
      taxes: results.map((r) => r.totalTax),
    });
  }
  return points;
}

/**
 * A sensible chart range: at least $250k, and comfortably above the
 * scenario's income.
 */
export function chartMaxIncome(income: number): number {
  return roundChartIncome(Math.max(250_000, income * 1.5));
}

/**
 * The marginal rate chart's range: the usual range, extended past every
 * plan's top bracket threshold (and federal BPA phase-out) so each rate
 * change is visible, e.g. a new bracket at $1M.
 */
export function marginalChartMaxIncome(
  comparison: Pick<ScenarioComparison, "plans">,
  income: number,
): number {
  const lastChange = Math.max(
    ...comparison.plans.flatMap(({ config }) =>
      [config.federal.incomeTax, config.provincial.incomeTax].map((tax) =>
        Math.max(
          tax.brackets[tax.brackets.length - 1]?.min ?? 0,
          tax.credits?.bpaPhaseOut?.end ?? 0,
        ),
      ),
    ),
  );
  return Math.max(chartMaxIncome(income), roundChartIncome(lastChange * 1.25));
}

function roundChartIncome(target: number): number {
  const step = target > 1_000_000 ? 250_000 : 50_000;
  return Math.ceil(target / step) * step;
}

/**
 * Plain-language summary of a comparison, e.g. for link previews:
 * "At $100,000 income. Proposed change: $2,412 less a year than Ontario 2026
 * (43.4% → 41.1% marginal)."
 */
export function describeComparison(
  scenario: TaxScenario,
  comparison: ScenarioComparison,
  lang: ScenarioLang = "en",
): string {
  const text = SCENARIO_TEXT[lang];
  const pct = (rate: number) =>
    lang === "fr"
      ? `${rate.toFixed(1).replace(".", ",")} %`
      : `${rate.toFixed(1)}%`;
  const { reference } = comparison;
  const income = formatWholeDollars(scenario.income);
  // French puts a space before the colon
  const sep = lang === "fr" ? " : " : ": ";
  const parts = comparison.plans.slice(1).map((p) => {
    const diff = Math.round(p.difference);
    if (diff === 0) return `${p.label}${sep}${text.sameAs(reference.label)}`;
    const rates = `${pct(reference.result.marginalTaxRate)} → ${pct(
      p.result.marginalTaxRate,
    )} ${text.marginal}`;
    return `${p.label}${sep}${text.moreOrLess(
      formatWholeDollars(Math.abs(diff)),
      diff > 0,
      reference.label,
    )} (${rates})`;
  });
  if (parts.length === 0) {
    return text.referenceOnly(
      income,
      reference.label,
      formatWholeDollars(reference.result.totalTax),
      lang === "fr"
        ? reference.result.marginalTaxRate.toFixed(1).replace(".", ",")
        : reference.result.marginalTaxRate.toFixed(1),
    );
  }
  return `${text.atIncome(income)}. ${parts.join(". ")}.`;
}
