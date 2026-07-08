import { SankeyData } from "@/components/Sankey/SankeyChartD3";
import fs from "fs";
import matter from "gray-matter";
import path from "path";

// ============================================================================
// FEDERAL SPENDING DATA LOADER
//
// Mirrors src/lib/jurisdictions.ts (filesystem-backed, synchronous) but reads
// the federal Public Accounts JSON contracts documented in
// docs/specs/federal-public-accounts-pipeline.md §7.
//
// The base directory is overridable via FEDERAL_DATA_DIR so the site layer can
// be developed/tested against fixture data before the data pipeline commits
// real JSON to data/federal/.
// ============================================================================

const FEDERAL_DATA_DIR =
  process.env.FEDERAL_DATA_DIR || path.join(process.cwd(), "data/federal");

// ---------------------------------------------------------------------------
// Types (see spec §7)
// ---------------------------------------------------------------------------

export type FederalMinistrySummary = {
  name: string;
  // Portfolio slug for real ministries (links to the department page). Absent
  // on the appended Vol I statement rows (Net actuarial losses, Provision for
  // valuation), which render as non-link rows.
  slug?: string;
  // Stable id for the non-link statement rows, keying their French label.
  id?: string;
  totalSpending: number;
  percentage: number;
  basis: string;
};

export type FederalInflation = {
  baseYear: number;
  multiplierToBase: number;
};

export type FederalSummary = {
  name: string;
  financialYear: string;
  financialYearEnding: number;
  source: string;
  source_url: string;
  units: string;
  inflation: FederalInflation;
  totalSpending: number;
  totalRevenue: number;
  deficit: number;
  basis: string;
  ministries: FederalMinistrySummary[];
};

export type FederalIndex = {
  years: number[];
  latestYear: number;
  defaultYear?: number;
  updatedAt?: string;
  source?: string;
  source_url?: string;
  ministries?: Array<{ slug: string; name: string }>;
  // Which department slugs exist for each year; used by generateStaticParams
  // and the YearSelector availability logic.
  departmentsByYear: Record<string, string[]>;
};

export type FederalReconciliationItem = {
  id?: string;
  name: string;
  amount: number;
  note?: string;
};

export type FederalReconciliation = {
  financialYearEnding: number;
  units: string;
  vol1Total: number;
  vol2MinistrySum: number;
  difference: number;
  items: FederalReconciliationItem[];
};

export type FederalEntity = {
  id?: string;
  name: string;
  value: number;
};

export type FederalTransferPayment = {
  id?: string;
  category: string;
  description: string;
  used: number;
};

export type FederalHistoricalPoint = {
  year: number;
  percentage: number;
};

export type FederalDepartment = {
  name: string;
  slug: string;
  financialYearEnding: number;
  basis: string;
  totalSpending: number;
  percentageOfFederal: number;
  historicalShare: FederalHistoricalPoint[];
  miniSankey: { spending_data: FederalSankeyNode };
  entities: FederalEntity[];
  transferPayments: FederalTransferPayment[];
  lineItemsUnits: string;
  // Optional machinery-of-government note (spec §4.3).
  reportedAs?: string;
};

export type FederalSankeyNode = {
  id?: string;
  name?: string;
  displayName?: string;
  vote?: string;
  amount?: number;
  isAggregate?: boolean;
  count?: number;
  children?: FederalSankeyNode[];
};

export type FederalHistoricalPre2013 = {
  units: string;
  source?: string;
  departments: Record<string, FederalHistoricalPoint[]>;
};

export type FederalProse = {
  content: string;
  reviewed: boolean;
};

export type FederalWorkforceDepartment = {
  name: string;
  slug?: string;
  headcount: number;
  resolved: boolean;
};

export type FederalWorkforce = {
  financialYearEnding: number;
  headcount: number;
  headcountAsOf: string;
  // Government-wide Personnel standard object, in billions of CAD (nominal).
  personnelSpending: number;
  // Personnel dollars ÷ headcount, whole dollars (salaries + benefits).
  averagePersonnelCost: number;
  source: string;
  source_url: string;
  headcountByDepartment?: FederalWorkforceDepartment[];
};

export type FederalWorkforcePoint = {
  year: number;
  headcount: number;
};

type FrMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function yearDir(year: string | number): string {
  return path.join(FEDERAL_DATA_DIR, String(year));
}

// ---------------------------------------------------------------------------
// Index / years / slugs
// ---------------------------------------------------------------------------

let cachedIndex: FederalIndex | null | undefined;

export function getFederalIndex(): FederalIndex | null {
  if (cachedIndex === undefined) {
    cachedIndex = readJson<FederalIndex>(
      path.join(FEDERAL_DATA_DIR, "index.json"),
    );
  }
  return cachedIndex;
}

/**
 * Available fiscal years (ending year, e.g. 2025), sorted descending.
 * Returns [] when the pipeline has not run yet (index.json absent) so that
 * generateStaticParams does not break the build.
 */
export function getFederalYears(): number[] {
  const index = getFederalIndex();
  if (!index?.years?.length) {
    return [];
  }
  return [...index.years].sort((a, b) => b - a);
}

export function getFederalLatestYear(): number | null {
  const index = getFederalIndex();
  if (index?.latestYear) {
    return index.latestYear;
  }
  const years = getFederalYears();
  return years.length ? years[0] : null;
}

export function getFederalDefaultYear(): number | null {
  const index = getFederalIndex();
  return index?.defaultYear ?? getFederalLatestYear();
}

/**
 * True when the given year is a valid, published federal year. Guards the
 * [year] route against non-year or unpublished segments.
 */
export function isValidFederalYear(year: string | number): boolean {
  if (!/^20\d\d$/.test(String(year))) {
    return false;
  }
  return getFederalYears().includes(Number(year));
}

export function getFederalDepartmentSlugs(year: string | number): string[] {
  const index = getFederalIndex();
  const fromIndex = index?.departmentsByYear?.[String(year)];
  if (fromIndex?.length) {
    return fromIndex;
  }
  // Fallback: read the departments directory on disk.
  try {
    const dir = path.join(yearDir(year), "departments");
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json") && !f.includes(".prose."))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

/**
 * Years (descending) in which a given department slug has a page. Used by the
 * YearSelector on department pages so that years missing the slug (machinery
 * of government changes) link to the year overview instead.
 */
export function getFederalYearsForDepartment(slug: string): number[] {
  return getFederalYears().filter((year) =>
    getFederalDepartmentSlugs(year).includes(slug),
  );
}

// ---------------------------------------------------------------------------
// French label substitution (spec §8)
//
// fr.json is a flat map of stable id -> official/translated French label.
// Substitution happens server-side, keyed by the stable `id` on each node.
// Anything without a matching id falls back to the English label.
// ---------------------------------------------------------------------------

function loadFrMap(year: string | number): FrMap {
  return readJson<FrMap>(path.join(yearDir(year), "i18n", "fr.json")) ?? {};
}

function tr(fr: FrMap, id: string | undefined, english: string): string {
  if (id && fr[id]) {
    return fr[id];
  }
  return english;
}

function translateSankeyNode(
  node: FederalSankeyNode,
  fr: FrMap,
): FederalSankeyNode {
  const translated: FederalSankeyNode = {
    ...node,
    name: tr(fr, node.id, node.name ?? node.displayName ?? ""),
  };
  if (node.children) {
    translated.children = node.children.map((c) => translateSankeyNode(c, fr));
  }
  return translated;
}

// ---------------------------------------------------------------------------
// Public loaders
// ---------------------------------------------------------------------------

export function getFederalSummary(
  year: string | number,
  lang: string = "en",
): FederalSummary | null {
  const summary = readJson<FederalSummary>(
    path.join(yearDir(year), "summary.json"),
  );
  if (!summary || lang !== "fr") {
    return summary;
  }

  // French ministry-list labels: real ministries are keyed by slug (same key
  // the department page uses), the appended statement rows by their stable id.
  // Anything without a match falls back to the English label.
  const fr = loadFrMap(year);
  return {
    ...summary,
    ministries: summary.ministries.map((m) => ({
      ...m,
      name: tr(fr, m.slug ?? m.id, m.name),
    })),
  };
}

/**
 * Sankey data for a year. When lang === "fr", node `name`s are replaced by
 * their French label from i18n/fr.json (keyed by node `id`), falling back to
 * English. The returned shape is the existing SankeyData consumed by
 * <SankeyChart /> (name-based nodes; ids are converted client-side).
 */
export function getFederalSankey(
  year: string | number,
  lang: string = "en",
): SankeyData | null {
  const data = readJson<{
    total: number;
    spending: number;
    revenue: number;
    spending_data: FederalSankeyNode;
    revenue_data: FederalSankeyNode;
  }>(path.join(yearDir(year), "sankey.json"));

  if (!data) {
    return null;
  }

  if (lang === "fr") {
    const fr = loadFrMap(year);
    return {
      ...data,
      spending_data: translateSankeyNode(data.spending_data, fr),
      revenue_data: translateSankeyNode(data.revenue_data, fr),
    } as unknown as SankeyData;
  }

  return data as unknown as SankeyData;
}

export function getFederalDepartment(
  year: string | number,
  slug: string,
  lang: string = "en",
): FederalDepartment | null {
  const dept = readJson<FederalDepartment>(
    path.join(yearDir(year), "departments", `${slug}.json`),
  );
  if (!dept) {
    return null;
  }

  if (lang !== "fr") {
    return dept;
  }

  const fr = loadFrMap(year);
  return {
    ...dept,
    // Department display name is keyed by its slug in fr.json.
    name: tr(fr, dept.slug, dept.name),
    miniSankey: {
      spending_data: translateSankeyNode(dept.miniSankey.spending_data, fr),
    },
    entities: dept.entities.map((e) => ({
      ...e,
      name: tr(fr, e.id, e.name),
    })),
    transferPayments: dept.transferPayments.map((tp) => ({
      ...tp,
      description: tr(fr, tp.id, tp.description),
    })),
  };
}

export function getFederalReconciliation(
  year: string | number,
): FederalReconciliation | null {
  return readJson<FederalReconciliation>(
    path.join(yearDir(year), "reconciliation.json"),
  );
}

/**
 * Per-year federal workforce (TBS headcount + Public Accounts personnel
 * spending). Returns null when the year has no workforce.json so the overview
 * page can guard the workforce strip. Language-independent: department labels
 * are raw source data, not translated content.
 */
export function getFederalWorkforce(
  year: string | number,
): FederalWorkforce | null {
  return readJson<FederalWorkforce>(path.join(yearDir(year), "workforce.json"));
}

/**
 * Headcount-over-time series (ascending by year) across every published year
 * that carries workforce.json. Feeds the overview line chart.
 */
export function getFederalWorkforceSeries(): FederalWorkforcePoint[] {
  return getFederalYears()
    .slice()
    .sort((a, b) => a - b)
    .map((year) => {
      const wf = getFederalWorkforce(year);
      return wf ? { year, headcount: wf.headcount } : null;
    })
    .filter((p): p is FederalWorkforcePoint => p !== null);
}

let cachedHistorical: FederalHistoricalPre2013 | null | undefined;

/**
 * Static pre-2013 department-share points (spec §12). Returns null when the
 * file is absent so callers can skip merging.
 */
export function getHistoricalPre2013(): FederalHistoricalPre2013 | null {
  if (cachedHistorical === undefined) {
    cachedHistorical = readJson<FederalHistoricalPre2013>(
      path.join(FEDERAL_DATA_DIR, "historical_pre2013.json"),
    );
  }
  return cachedHistorical;
}

/**
 * Department prose (spec §9). Renders only when present on disk and not
 * explicitly marked `reviewed: false` in frontmatter. Dollar/percentage
 * placeholders (e.g. {{totalSpending}}) are interpolated at render time; the
 * markdown itself never contains literal figures.
 */
export function getFederalDepartmentProse(
  year: string | number,
  slug: string,
  lang: string = "en",
): FederalProse | null {
  const file = path.join(
    yearDir(year),
    "departments",
    `${slug}.prose.${lang}.md`,
  );
  try {
    if (!fs.existsSync(file)) {
      return null;
    }
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const reviewed = parsed.data?.reviewed !== false;
    return { content: parsed.content.trim(), reviewed };
  } catch {
    return null;
  }
}
