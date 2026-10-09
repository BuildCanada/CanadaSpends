import { provinceNames } from "../provinceNames";

import { calculateTaxWithConfig } from "./calculator";
import { getDefaultYear, getSupportedYears, getTaxConfig } from "./configs";
import {
  DetailedTaxCalculation,
  SupportedYear,
  TaxBracket,
  TaxYearProvinceConfig,
} from "./types";

/**
 * One set of tax rules: a province and tax year, optionally with
 * user-defined changes. A plan with no overrides is that province's current
 * law, which is how province-to-province comparisons work.
 *
 * Overrides are `null` / `false` when the plan uses current law for that
 * parameter, which keeps shared URLs short.
 */
export interface TaxPlan {
  name: string;
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
 * A titled comparison of plans at one income. The first plan is the
 * reference that every other plan is compared against. Every field
 * round-trips through the URL query string so it can be shared as a link.
 */
export interface TaxScenario {
  title: string;
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
export const MAX_SCENARIO_TITLE_LENGTH = 80;
export const MAX_PLAN_NAME_LENGTH = 40;
export const MAX_SCENARIO_BRACKETS = 10;
/** URL prefixes for each plan; the length is the maximum number of plans. */
export const PLAN_KEYS = ["a", "b", "c", "d"] as const;
export const MAX_PLANS = PLAN_KEYS.length;
export const MAX_SCENARIO_INCOME = 100_000_000;

export function createPlan(
  province: string = DEFAULT_SCENARIO_PROVINCE,
  year: SupportedYear = getDefaultYear(),
): TaxPlan {
  return {
    name: "",
    province,
    year,
    federalBrackets: null,
    federalBpa: null,
    provincialBrackets: null,
    provincialBpa: null,
    removeSurtax: false,
    removeHealthPremium: false,
  };
}

/** Current law vs. an (initially unchanged) plan to edit. */
export function createDefaultScenario(): TaxScenario {
  return {
    title: "",
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

function limitText(text: string, max: number): string {
  return text.trim().slice(0, max).trim();
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

function parseYear(value: string | null): SupportedYear | null {
  return value && getSupportedYears().includes(value as SupportedYear)
    ? (value as SupportedYear)
    : null;
}

/**
 * Read one plan's settings. Keys are `<prefix>province`, `<prefix>fb`, etc.,
 * where the prefix is e.g. `b.` (or empty for legacy single-plan links).
 */
function parsePlan(
  params: SearchParamsLike,
  prefix: string,
  fallback: TaxPlan,
): TaxPlan {
  const get = (key: string) => getParam(params, `${prefix}${key}`);
  return {
    name: limitText(get("name") ?? "", MAX_PLAN_NAME_LENGTH),
    province: parseProvince(get("province")) ?? fallback.province,
    year: parseYear(get("year")) ?? fallback.year,
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

export function parseScenario(params: SearchParamsLike): TaxScenario {
  const scenario = createDefaultScenario();

  scenario.title = limitText(
    getParam(params, "title") ?? "",
    MAX_SCENARIO_TITLE_LENGTH,
  );

  const income = parseAmount(getParam(params, "income"));
  if (income !== null && income > 0) scenario.income = income;

  if (hasPlanParams(params, PLAN_KEYS[0])) {
    // Plans are listed in order; stop at the first missing one.
    const plans: TaxPlan[] = [];
    for (const key of PLAN_KEYS) {
      if (!hasPlanParams(params, key)) break;
      plans.push(parsePlan(params, `${key}.`, plans[0] ?? createPlan()));
    }
    scenario.plans = plans;
  } else {
    // Legacy single-plan links: unprefixed province/year/overrides describe
    // a plan compared against current law in the same province and year.
    const legacy = parsePlan(params, "", createPlan());
    legacy.name = "";
    scenario.plans = [createPlan(legacy.province, legacy.year), legacy];
  }

  return scenario;
}

/**
 * Serialize a scenario to query params. Overrides that match current law are
 * omitted so the link only carries what was actually changed.
 */
export function serializeScenario(scenario: TaxScenario): URLSearchParams {
  const params = new URLSearchParams();
  const title = limitText(scenario.title, MAX_SCENARIO_TITLE_LENGTH);
  if (title) params.set("title", title);
  params.set("income", String(limitAmount(scenario.income)));

  scenario.plans.slice(0, MAX_PLANS).forEach((plan, i) => {
    const prefix = `${PLAN_KEYS[i]}.`;
    for (const [key, value] of Object.entries(planOverrideParams(plan))) {
      params.set(`${prefix}${key}`, value);
    }
    // Province and year are always written so each plan is present in the URL
    params.set(`${prefix}province`, PROVINCE_TO_CODE[plan.province] ?? "ON");
    params.set(`${prefix}year`, plan.year);
    const name = limitText(plan.name, MAX_PLAN_NAME_LENGTH);
    if (name) params.set(`${prefix}name`, name);
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

/** Whether two plans describe the same rules (ignoring names). */
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
 * Display name for a plan. In order of preference:
 * - the user's name for it
 * - "Plan B" for a changed plan, or an unchanged copy of an earlier
 *   unchanged plan with the same rules
 * - "Current law" for unchanged rules that another (changed) plan edits
 * - the province ("Ontario"), plus the year if the plans span several years
 */
export function planLabel(plan: TaxPlan, index: number, plans: TaxPlan[]) {
  if (plan.name.trim()) return plan.name.trim();
  const sameRules = (other: TaxPlan) =>
    other.province === plan.province && other.year === plan.year;
  const letter = `Plan ${PLAN_KEYS[index].toUpperCase()}`;
  if (planHasChanges(plan)) return letter;
  const earlierTwin = plans
    .slice(0, index)
    .some((other) => sameRules(other) && !planHasChanges(other));
  if (earlierTwin) return letter;
  if (
    plans.some(
      (other) => other !== plan && sameRules(other) && planHasChanges(other),
    )
  ) {
    return "Current law";
  }
  const province = PROVINCE_NAMES[plan.province] ?? plan.province;
  const mixedYears = plans.some((other) => other.year !== plan.year);
  return mixedYears ? `${province} ${plan.year}` : province;
}

/** A default title from the plan labels, e.g. "Ontario vs Alberta". */
export function defaultScenarioTitle(scenario: TaxScenario): string {
  const labels = scenario.plans.map((p, i) => planLabel(p, i, scenario.plans));
  if (!scenarioHasChanges(scenario)) return "Build a tax plan";
  return labels.join(" vs ");
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
      incomeTax: {
        ...config.federal.incomeTax,
        brackets: plan.federalBrackets ?? config.federal.incomeTax.brackets,
        basicPersonalAmount:
          plan.federalBpa ?? config.federal.incomeTax.basicPersonalAmount,
      },
    },
    provincial: {
      ...provincialRest,
      ...(surtax && !plan.removeSurtax ? { surtax } : {}),
      ...(healthPremium && !plan.removeHealthPremium ? { healthPremium } : {}),
      incomeTax: {
        ...config.provincial.incomeTax,
        brackets:
          plan.provincialBrackets ?? config.provincial.incomeTax.brackets,
        basicPersonalAmount:
          plan.provincialBpa ?? config.provincial.incomeTax.basicPersonalAmount,
      },
    },
  };
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
  /** Change in effective rate vs the reference, in percentage points */
  effectiveRateChange: number;
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
): ScenarioComparison | null {
  const computed = scenario.plans.flatMap((plan, index) => {
    const baseConfig = getTaxConfig(plan.year, plan.province);
    if (!baseConfig) return [];
    const config = applyPlan(baseConfig, plan);
    return [
      {
        plan,
        label: planLabel(plan, index, scenario.plans),
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
    effectiveRateChange: p.result.effectiveTaxRate - ref.effectiveTaxRate,
  }));
  return { plans, reference: plans[0] };
}

export interface RateCurvePoint {
  income: number;
  /** Effective rate per plan, in the same order as the comparison's plans */
  rates: number[];
  /** Total tax per plan */
  taxes: number[];
}

/**
 * Effective tax rate for each plan across a range of incomes, for charting.
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
      rates: results.map((r) => r.effectiveTaxRate),
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
  const target = Math.max(250_000, income * 1.5);
  const step = target > 1_000_000 ? 250_000 : 50_000;
  return Math.ceil(target / step) * step;
}

export function formatWholeDollars(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Plain-English summary of a comparison, e.g. for link previews:
 * "At $100,000: Plan B $2,412 less than Ontario 2025 (24.5% → 22.1%)."
 */
export function describeComparison(
  scenario: TaxScenario,
  comparison: ScenarioComparison,
): string {
  const { reference } = comparison;
  const parts = comparison.plans.slice(1).map((p) => {
    const diff = Math.round(p.difference);
    const rates = `${reference.result.effectiveTaxRate.toFixed(
      1,
    )}% → ${p.result.effectiveTaxRate.toFixed(1)}% effective`;
    if (diff === 0) return `${p.label}: same as ${reference.label}`;
    return `${p.label}: ${formatWholeDollars(Math.abs(diff))} ${
      diff < 0 ? "less" : "more"
    } a year than ${reference.label} (${rates})`;
  });
  if (parts.length === 0) {
    return `At ${formatWholeDollars(scenario.income)} income, ${
      reference.label
    } means ${formatWholeDollars(reference.result.totalTax)} in tax (${reference.result.effectiveTaxRate.toFixed(1)}% effective).`;
  }
  return `At ${formatWholeDollars(scenario.income)} income. ${parts.join(
    ". ",
  )}.`;
}
