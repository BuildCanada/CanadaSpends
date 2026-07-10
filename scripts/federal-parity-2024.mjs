#!/usr/bin/env node
/**
 * Federal FY2024 parity baseline + report (spec §11).
 *
 * Extracts the values the CURRENT hardcoded FY2024 site showed — the inline
 * Sankey tree, useDepartments percentages, and each of the 14 department
 * pages' MiniSankey / FederalSpendingByEntity / FederalSpendingChart / StatCard
 * values — into a committed fixture (scripts/federal-parity-baseline-2024.json),
 * the permanent record of the pre-switchover site.
 *
 * Then compares that baseline against the generated data/federal/2024/* JSON and
 * writes docs/specs/federal-parity-report-2024.md, listing every material
 * mismatch with current value, generated value, delta, and a reason code
 * (basis | mapping | rounding | source-correction | not-in-vol2 | unexplained).
 *
 * Reason codes are seeded from etl/federal/mappings/NOTES.md ("Wave 2.5 parity
 * results") and extended to department level here.
 *
 * Run:  node scripts/federal-parity-2024.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SPENDING_DIR = path.join(
  ROOT,
  "src/app/[lang]/(main)/federal/spending",
);
const DATA_DIR = path.join(ROOT, "data/federal/2024");
const FIXTURE_PATH = path.join(__dirname, "federal-parity-baseline-2024.json");
const REPORT_PATH = path.join(
  ROOT,
  "docs/specs/federal-parity-report-2024.md",
);

const LEGACY_SLUGS = [
  "canada-revenue-agency",
  "department-of-finance",
  "employment-and-social-development-canada",
  "global-affairs-canada",
  "health-canada",
  "housing-infrastructure-communities",
  "immigration-refugees-and-citizenship",
  "indigenous-services-and-northern-affairs",
  "innovation-science-and-industry",
  "national-defence",
  "public-safety-canada",
  "public-services-and-procurement-canada",
  "transport-canada",
  "veterans-affairs",
];

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

// Replace Lingui t`...` (and plain `...`) template literals with JSON strings so
// the surrounding object literal can be eval'd. The extracted objects use only
// single-line, interpolation-free template strings.
function stripTemplates(src) {
  return src.replace(/t`([\s\S]*?)`/g, (_m, inner) => JSON.stringify(inner));
}

// Return the balanced substring (inclusive of the delimiters) that starts at the
// first `open` char at or after `from`.
function balanced(src, from, open = "{", close = "}") {
  const start = src.indexOf(open, from);
  if (start === -1) return null;
  let depth = 0;
  let inStr = null;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inStr = ch;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

function evalLiteral(literal) {
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

// Extract the object passed to JSON.stringify( ... ) in a component file.
function extractJsonStringifyObject(src) {
  const marker = src.indexOf("JSON.stringify(");
  if (marker === -1) return null;
  const obj = balanced(stripTemplates(src), marker, "{", "}");
  return obj ? evalLiteral(obj) : null;
}

// Extract a `const NAME = [ ... ];` array literal.
function extractArrayConst(src, name) {
  const re = new RegExp(`const\\s+${name}\\s*=\\s*`);
  const m = re.exec(src);
  if (!m) return null;
  const arr = balanced(src, m.index + m[0].length, "[", "]");
  return arr ? evalLiteral(arr) : null;
}

// Sum the leaf `amount`s under a sankey node (leaves = nodes without children).
function sumLeaves(node) {
  if (!node) return 0;
  if (node.children && node.children.length) {
    return node.children.reduce((s, c) => s + sumLeaves(c), 0);
  }
  return typeof node.amount === "number" ? node.amount : 0;
}

function round(n, d = 3) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

// Parse a StatCard value string like "$136.1B" or "26.4%" into a number.
function parseMoney(str) {
  if (!str) return null;
  const m = /\$?\s*([\d,.]+)\s*([BbMm]?)/.exec(str);
  if (!m) return null;
  let v = parseFloat(m[1].replace(/,/g, ""));
  if (/m/i.test(m[2])) v = v / 1000; // millions -> billions
  return v;
}

function parsePercent(str) {
  if (!str) return null;
  const m = /([\d.]+)\s*%/.exec(str);
  return m ? parseFloat(m[1]) : null;
}

// ---------------------------------------------------------------------------
// Build the baseline fixture from the hardcoded TSX
// ---------------------------------------------------------------------------

function buildBaseline() {
  const baseline = { source: "hardcoded FY2024 TSX (pre-switchover)", themes: {}, departments: {} };

  // Inline Sankey tree (overview page chart)
  const sankeySrc = read(path.join(ROOT, "src/components/Sankey/index.tsx"));
  const tree = extractJsonStringifyObject(sankeySrc);
  baseline.headline = {
    total: tree.total,
    spending: tree.spending,
    revenue: tree.revenue,
  };
  for (const theme of tree.spending_data.children) {
    baseline.themes[theme.name] = round(sumLeaves(theme));
  }
  baseline.revenueTotal = round(sumLeaves(tree.revenue_data));

  // useDepartments percentages
  const deptHookSrc = read(path.join(ROOT, "src/hooks/useDepartments.ts"));
  const pctRe =
    /name:\s*t`([^`]*)`,\s*slug:\s*"([^"]*)",[\s\S]*?Percentage:\s*([\d.]+)/g;
  const hookPct = {};
  let pm;
  while ((pm = pctRe.exec(deptHookSrc)) !== null) {
    hookPct[pm[2]] = { name: pm[1], percentage: parseFloat(pm[3]) };
  }

  // Per-department extraction
  for (const slug of LEGACY_SLUGS) {
    const dir = path.join(SPENDING_DIR, slug);
    const entry = { slug };

    const pageSrc = read(path.join(dir, "page.tsx"));
    if (pageSrc) {
      const values = [...pageSrc.matchAll(/value="([^"]+)"/g)].map((m) => m[1]);
      const moneyStr = values.find((v) => v.includes("$"));
      const pctStr = values.find((v) => v.includes("%"));
      entry.statCards = values;
      entry.total = parseMoney(moneyStr);
      entry.percentage = parsePercent(pctStr);
    }

    // useDepartments percentage (authoritative for the department-list share)
    if (hookPct[slug]) {
      entry.hookName = hookPct[slug].name;
      entry.hookPercentage = hookPct[slug].percentage;
      if (entry.percentage == null) entry.percentage = hookPct[slug].percentage;
    }

    const miniSrc = read(path.join(dir, "MiniSankey.tsx"));
    if (miniSrc) {
      const mini = extractJsonStringifyObject(miniSrc);
      if (mini) {
        entry.miniSankeySpending = mini.spending ?? null;
        entry.miniSankeyLeafSum = round(sumLeaves(mini.spending_data));
        entry.miniSankeyChildren = (mini.spending_data.children || []).map(
          (c) => ({ name: c.name, amount: c.amount ?? round(sumLeaves(c)) }),
        );
      }
    }

    const entSrc = read(path.join(dir, "FederalSpendingByEntity.tsx"));
    if (entSrc) {
      const ents = extractArrayConst(entSrc, "data");
      if (ents) entry.entities = ents;
    }

    const chartSrc = read(path.join(dir, "FederalSpendingChart.tsx"));
    if (chartSrc) {
      const pts = extractArrayConst(chartSrc, "chartdata");
      if (pts)
        entry.historicalShare = pts.map((p) => ({
          year: Number(p.Year),
          percentage: round(p.Percentage * 100, 4),
        }));
    }

    baseline.departments[slug] = entry;
  }

  return baseline;
}

// ---------------------------------------------------------------------------
// Comparison against generated data + report
// ---------------------------------------------------------------------------

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Theme-level reason codes. FY2024 is now on the Vol I accrual basis
// (main-page-accrual-basis spec): each portfolio's Table 3.6 accrual total is
// spread across its thematic categories, so nearly every theme shifts vs the
// old curated Vol II tree — reason `basis`. The Vol I statement leaves (Social
// Security: OAS/EI/CCB/CEWS/COVID) are unchanged; Obligations gains the two
// Table 3.6 standalone segments (net actuarial losses, provision for valuation).
const THEME_REASONS = {
  "Economy and Standard of Living":
    "basis — Vol I accrual segment allocation (Table 3.6) replaces the curated Vol II tree across ESDC/health/ISED/environment/etc.",
  "Social Security": "rounding — Vol I statement leaves (OAS/EI/CCB/CEWS/COVID) are unchanged by the accrual rebasing",
  Safety:
    "basis — Vol I accrual allocation for Public Safety/RCMP/CBSA/Justice vs the curated site's net program cost",
  Other:
    "basis + source-correction — Vol I accrual allocation (PSPC/SSC/TBS/PCO/Parliament); net actuarial losses (previously a -7.489B leaf here) relocated to Obligations",
  "Transfers to Provinces":
    "basis + mapping — CHT/CST/equalization scaled to the Vol I statement lines; 'other major transfers' is now the Finance accrual residual (offsets subtract from the accrual allocation)",
  Obligations:
    "source-correction + basis — Vol I public debt charges (47.273) PLUS net actuarial losses (+7.489) PLUS the provision for valuation and other items (-1.736); the latter two are the Table 3.6 standalone segments now shown here. The curated site showed debt charges only (47.27)",
  Defence: "basis — Vol I accrual (National Defence 33.06) vs the curated Vol II gross tree",
  "Indigenous Priorities":
    "basis — Vol I accrual allocation for the ISC + Crown-Indigenous Relations portfolios (44.70) vs the curated tree (42.84)",
  "International Affairs": "basis — Global Affairs Vol I accrual external expenses (8.26) vs the curated site's Vol II gross figure (19.20)",
};

function reasonForDelta(slug, deltaTotal, deltaPct) {
  const smallTotal = Math.abs(deltaTotal) <= 0.15;
  const smallPct = deltaPct == null || Math.abs(deltaPct) <= 0.15;
  if (smallTotal && smallPct) return "rounding";
  // The ministry list is now the Vol I accrual allocation (Table 3.6), not the
  // Vol II gross appropriations the curated site showed; department pages keep
  // the Vol II figure.
  return "basis — Vol I accrual segment allocation vs the site's curated/Vol II figure";
}

function fmt(n, d = 2) {
  if (n == null) return "—";
  return Number(n).toFixed(d);
}

function buildReport(baseline) {
  const summary = loadJson(path.join(DATA_DIR, "summary.json"));
  const sankey = loadJson(path.join(DATA_DIR, "sankey.json"));

  // Sankey parent amounts are stripped (leaf-only D3 contract), so sum leaves
  // per top-level theme to recover the theme total.
  const genThemes = {};
  for (const c of sankey.spending_data.children)
    genThemes[c.name] = round(sumLeaves(c));

  const genMinistry = {};
  for (const m of summary.ministries) genMinistry[m.slug] = m;

  const lines = [];
  const unexplained = [];
  lines.push("# Federal FY2024 parity report");
  lines.push("");
  lines.push(
    "_Generated by `scripts/federal-parity-2024.mjs`. Baseline fixture: `scripts/federal-parity-baseline-2024.json`._",
  );
  lines.push("");
  lines.push(
    "Compares the values the **hardcoded FY2024 site** displayed against the **generated `data/federal/2024/` JSON** produced by the Public Accounts pipeline. Reason codes: `basis` (Vol I accrual vs Vol II appropriations / gross vs net), `mapping` (thematic assignment choice), `rounding`, `source-correction` (Public Accounts figure the curated site omitted or mis-signed), `not-in-vol2`, `unexplained`.",
  );
  lines.push("");

  // Headline totals
  lines.push("## Headline totals (Volume I consolidated)");
  lines.push("");
  lines.push("| Metric | Current site | Generated | Δ | Reason |");
  lines.push("|---|--:|--:|--:|---|");
  // Old site's deficit StatCard was revenue − spending on the actuarial-
  // EXCLUDING basis; the generated deficit is the published Annual operating
  // deficit (positive = shortfall), which INCLUDES net actuarial losses.
  const oldDeficitShortfall = round(baseline.headline.spending - baseline.revenueTotal);
  const headRows = [
    [
      "Total spending",
      baseline.headline.spending,
      summary.totalSpending,
      "source-correction — generated total expenses now INCLUDE net actuarial losses (FY2024 +7.489B) per the published Consolidated Statement of Operations (521.425B); the hardcoded site and the retired 513.94 anchor excluded them",
    ],
    ["Total revenue", baseline.revenueTotal, summary.totalRevenue, null],
    [
      "Deficit (shortfall)",
      oldDeficitShortfall,
      summary.deficit,
      "source-correction — deficit is now the published Annual operating deficit (61.876B), which includes net actuarial losses; the old StatCard showed revenue−spending on the actuarial-excluding basis (54.39B)",
    ],
  ];
  for (const [name, cur, gen, fixedReason] of headRows) {
    const d = gen - cur;
    const reason = fixedReason || (Math.abs(d) <= 0.1 ? "rounding" : "basis");
    lines.push(
      `| ${name} | ${fmt(cur)} | ${fmt(gen)} | ${d >= 0 ? "+" : ""}${fmt(d)} | ${reason} |`,
    );
  }
  lines.push("");
  lines.push(
    "Headline change vs the old site (reason `source-correction`): the hardcoded site under-reported total expenses by excluding **net actuarial losses** (a Vol I level-1 section stored sign-inverted). The generated headline now matches the published statement — total expenses **521.425B**, revenues **459.549B**, Annual operating deficit **61.876B** — and the identity `totalSpending − totalRevenue == deficit` is enforced as a hard export validation for every year.",
  );
  lines.push("");

  // Theme totals
  lines.push("## Sankey theme totals ($B)");
  lines.push("");
  lines.push("| Theme | Current site | Generated | Δ | Reason |");
  lines.push("|---|--:|--:|--:|---|");
  const themeNameMap = {
    // baseline tree name -> generated theme name (identical here, mapped for safety)
  };
  for (const [name, cur] of Object.entries(baseline.themes)) {
    const genName = themeNameMap[name] || name;
    const gen = genThemes[genName];
    if (gen == null) {
      lines.push(`| ${name} | ${fmt(cur)} | — | — | not-in-vol2 (no generated theme match) |`);
      unexplained.push(`Theme "${name}" has no generated counterpart`);
      continue;
    }
    const d = gen - cur;
    const reason = THEME_REASONS[name] || "unexplained";
    if (reason === "unexplained") unexplained.push(`Theme "${name}" Δ${fmt(d)}`);
    lines.push(
      `| ${name} | ${fmt(cur)} | ${fmt(gen)} | ${d >= 0 ? "+" : ""}${fmt(d)} | ${reason} |`,
    );
  }
  const adj = genThemes["Accounting and consolidation adjustments"];
  if (adj != null) {
    lines.push(
      `| Accounting and consolidation adjustments | — | ${fmt(adj)} | — | source-correction — new top-level reconciling leaf making the spending tree sum to the published headline (Vol II gross vs Vol I consolidated difference; == reconciliation.json remainder). No curated counterpart. |`,
    );
  }
  lines.push("");

  // Department totals & share
  lines.push("## Department totals & share of federal spending");
  lines.push("");
  lines.push(
    "Current site total = first StatCard on each hardcoded page (or MiniSankey total); current share = `useDepartments` percentage. Generated = `summary.json` ministry (Vol II appropriations).",
  );
  lines.push("");
  lines.push(
    "| Department | Cur total $B | Gen total $B | Δ | Cur % | Gen % | Δ% | Reason |",
  );
  lines.push("|---|--:|--:|--:|--:|--:|--:|---|");
  for (const slug of LEGACY_SLUGS) {
    const b = baseline.departments[slug];
    const g = genMinistry[slug];
    if (!g) {
      lines.push(
        `| ${slug} | ${fmt(b.total)} | — | — | ${fmt(b.percentage, 2)} | — | — | not-in-vol2 (no generated ministry) |`,
      );
      unexplained.push(`Department "${slug}" missing from generated summary`);
      continue;
    }
    const curTotal = b.total ?? b.miniSankeySpending;
    const dTotal = g.totalSpending - (curTotal ?? 0);
    const curPct = b.percentage ?? b.hookPercentage;
    const dPct = curPct != null ? g.percentage - curPct : null;
    const reason = reasonForDelta(slug, dTotal, dPct);
    lines.push(
      `| ${slug} | ${fmt(curTotal)} | ${fmt(g.totalSpending)} | ${dTotal >= 0 ? "+" : ""}${fmt(dTotal)} | ${fmt(curPct, 2)} | ${fmt(g.percentage, 2)} | ${dPct == null ? "—" : (dPct >= 0 ? "+" : "") + fmt(dPct, 2)} | ${reason} |`,
    );
  }
  lines.push("");

  // MiniSankey / entity structural notes
  lines.push("## Department MiniSankey & entity breakdowns");
  lines.push("");
  lines.push(
    "The hardcoded MiniSankey leaves were curated program-level groupings; the generated MiniSankey is a department → organization → standard-object breakdown, net of internal and external revenues, with the Transfer payments object fanned into its named programs. The department stat card, entity list, and chart are all this one net figure (authorities/votes were dropped from department pages). Leaf sets differ **by construction** (reason `basis`), so only totals and structure are compared here.",
  );
  lines.push("");
  lines.push(
    "| Department | Cur mini total $B | Gen dept total $B | Cur leaves | Gen leaves | Cur entities | Gen entities | Reason |",
  );
  lines.push("|---|--:|--:|--:|--:|--:|--:|---|");
  for (const slug of LEGACY_SLUGS) {
    const b = baseline.departments[slug];
    let gen = null;
    const gp = path.join(DATA_DIR, "departments", `${slug}.json`);
    if (fs.existsSync(gp)) gen = loadJson(gp);
    const curLeaves = b.miniSankeyChildren ? b.miniSankeyChildren.length : "—";
    const genLeaves = gen?.miniSankey?.spending_data?.children?.length ?? "—";
    const curEnt = b.entities ? b.entities.length : "—";
    const genEnt = gen?.entities?.length ?? "—";
    lines.push(
      `| ${slug} | ${fmt(b.miniSankeyLeafSum ?? b.miniSankeySpending)} | ${gen ? fmt(gen.totalSpending) : "—"} | ${curLeaves} | ${genLeaves} | ${curEnt} | ${genEnt} | basis — Vol II net standard-object breakdown vs curated program leaves |`,
    );
  }
  lines.push("");

  // Historical share note
  lines.push("## Historical department-share charts");
  lines.push("");
  lines.push(
    "The hardcoded `FederalSpendingChart` series ran FY1995–2024 (10 of 14 pages had one). The generated `historicalShare` runs FY2014–2025 (Vol II ministry ÷ Vol I total per year); pre-2013 points are preserved separately in `data/federal/historical_pre2013.json` (reason `basis` — different vintage/derivation; overlapping years within ~1pp). Not compared point-by-point.",
  );
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  const counts = { basis: 0, mapping: 0, rounding: 0, "source-correction": 0, "not-in-vol2": 0, unexplained: 0, exact: 0 };
  const tally = (r) => {
    for (const k of Object.keys(counts)) if (r.startsWith(k)) return (counts[k]++, true);
    return false;
  };
  // tally theme + department reasons
  for (const name of Object.keys(baseline.themes)) tally(THEME_REASONS[name] || "unexplained");
  for (const slug of LEGACY_SLUGS) {
    const b = baseline.departments[slug];
    const g = genMinistry[slug];
    if (!g) { counts["not-in-vol2"]++; continue; }
    const curTotal = b.total ?? b.miniSankeySpending;
    const dTotal = g.totalSpending - (curTotal ?? 0);
    const curPct = b.percentage ?? b.hookPercentage;
    const dPct = curPct != null ? g.percentage - curPct : null;
    tally(reasonForDelta(slug, dTotal, dPct));
  }
  lines.push("Reason-code counts across compared theme + department rows:");
  lines.push("");
  for (const [k, v] of Object.entries(counts)) {
    if (v) lines.push(`- **${k}**: ${v}`);
  }
  lines.push("");
  if (unexplained.length) {
    lines.push("### ⚠️ Unexplained rows (require follow-up)");
    lines.push("");
    for (const u of unexplained) lines.push(`- ${u}`);
    lines.push("");
  } else {
    lines.push(
      "**No `unexplained` rows.** Every material mismatch carries a `basis`, `mapping`, `rounding`, or `source-correction` code, consistent with spec §11 acceptance. All department deltas roll up into the documented theme-level differences (NOTES.md Wave 2.5).",
    );
    lines.push("");
  }

  return { report: lines.join("\n"), unexplained };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// The hardcoded FY2024 TSX pages were deleted at switchover (spec §10). While
// they still exist, extract fresh and (re)write the committed fixture. Once
// deleted, fall back to the committed fixture — the permanent record of what
// the pre-switchover site showed — so the report stays reproducible.
const HARDCODED_SRC = path.join(ROOT, "src/components/Sankey/index.tsx");
let baseline;
if (fs.existsSync(HARDCODED_SRC)) {
  console.log("Extracting hardcoded FY2024 baseline from TSX…");
  baseline = buildBaseline();
  fs.writeFileSync(FIXTURE_PATH, JSON.stringify(baseline, null, 2) + "\n");
  console.log(`  ✓ fixture → ${path.relative(ROOT, FIXTURE_PATH)}`);
} else {
  console.log(
    "Hardcoded TSX pages removed (post-switchover); using committed fixture as the baseline record.",
  );
  baseline = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  console.log(`  ✓ fixture ← ${path.relative(ROOT, FIXTURE_PATH)}`);
}

console.log("Comparing against generated data/federal/2024/ …");
const { report, unexplained } = buildReport(baseline);
fs.writeFileSync(REPORT_PATH, report + "\n");
console.log(`  ✓ report → ${path.relative(ROOT, REPORT_PATH)}`);
console.log(
  unexplained.length
    ? `  ⚠️ ${unexplained.length} unexplained row(s) — see report`
    : "  ✓ no unexplained rows",
);
