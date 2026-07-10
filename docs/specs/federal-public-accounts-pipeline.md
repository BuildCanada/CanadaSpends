# Spec: Federal spending pages generated from Public Accounts data

**Status:** Draft
**Date:** 2026-07-05
**Owner:** Brendan Samek

## 1. Summary

Replace the hardcoded federal spending pages (TSX-embedded data, single year, 14
hand-authored department pages) with statically generated pages built from JSON
that is itself generated from Public Accounts of Canada data. Output must match
the current site's FY2024 numbers — or almost match, with every difference
documented and explained on a methodology page.

This brings federal in line with the provincial/municipal architecture already
in the repo: per-year JSON under `/data`, a filesystem loader, and
`generateStaticParams`-driven routes.

### Goals

- Every path under `/federal/spending` (overview + all department pages) is
  data-driven, for **all fiscal years 2013–2025**, with a year toggle.
- Numbers are traceable to Public Accounts source tables; differences from the
  current hand-curated numbers are documented, not silently absorbed.
- Adding a new fiscal year is a pipeline run + JSON commit, not a code change.
- Full French coverage via LLM translation anchored to official terminology.

### Non-goals (this phase)

- The `/federal/budget` page and `BudgetSankey` (budget estimates, not public
  accounts) — unchanged.
- Workforce stats on the overview page (headcount, wages, age/tenure/salary
  charts) — sourced from TBS demographics, not public accounts. Keep hardcoded
  for now; factor into its own JSON later.
- The 1995–2024 historical department-share line charts for years before 2013
  (see §12 Open questions).
- Replacing the provincial/municipal pipeline or changing shared Sankey
  components beyond what federal needs.

## 2. Decisions (made 2026-07-05)

| Decision             | Choice                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sankey taxonomy      | **Keep the curated thematic tree**, populated via a maintained mapping from Public Accounts lines to thematic nodes                                                      |
| Accounting basis     | **Volume I (consolidated, accrual) for headline totals and top-level Sankey; Volume II (appropriations) for department drill-downs**, with a visible reconciliation note |
| Year coverage & URLs | **All years 2013–2025**, `[year]` route segments mirroring provincial; yearless URLs serve latest                                                                        |
| French               | **LLM-translate data labels**, glossary-anchored to official bilingual terminology; translations committed and reviewed, not generated at build                          |
| Department pages     | **All ministries get pages** every year, from one parameterized route                                                                                                    |
| Department prose     | **LLM-generated per department per year**, committed as reviewable files with guardrails (§9)                                                                            |
| Pipeline home        | **Copy the relevant Ruby ETL into `CanadaSpends/etl/federal/`** (stays Ruby to minimize rewrite risk); generated JSON committed to `/data/federal`                       |
| Chart depth          | **Top-N + "Other"** per Sankey node; complete line-item table below the chart                                                                                            |
| Default year         | **FY2025** (latest published)                                                                                                                                            |
| Pre-2013 history     | **Static file** (`data/federal/historical_pre2013.json`) carrying the current hardcoded 1995–2012 points; no PDF extraction                                              |
| Revenue detail       | **Statement-level only** (matches current revenue Sankey depth)                                                                                                          |
| Inflation            | **CPI real/nominal toggle**: each year's `summary.json` carries a CPI multiplier to base-year (2025) dollars; the site scales client-side, no duplicate JSON             |

## 3. Source data

Primary source is the existing `public_accounts` Ruby ETL (currently at
`/Volumes/floppy/public_accounts`), whose relevant parts move into
`etl/federal/` (§5). It provides:

| Dataset                                   | Source                                                                  | Granularity                                                  | Years     | Rows   |
| ----------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ------ |
| Budgetary details by allotment            | Vol II `dba-bda-eng.html` (per ministry, 2015+) / Vol III s10 (2013–14) | ministry → organization → vote → allotment                   | 2013–2025 | ~12.9k |
| Transfer payments by ministry             | Vol II `pt-tp-eng.html`                                                 | ministry → category (Grants/Contributions/Other) → line item | 2013–2025 | ~12.4k |
| Major transfers by province               | Vol I Table 3.7                                                         | province × transfer type                                     | 2013–2025 | 560    |
| Consolidated statements (totals, revenue) | open.canada.ca official CSVs (Vol I tables, e.g. revenues/deficit)      | statement line                                               | 2013–2025 | —      |
| CPI indexes                               | StatCan 18-10-0004                                                      | fiscal-year multiplier                                       | —         | —      |

Provenance and licensing: Open Government Licence – Canada;
`https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html`. Every generated
JSON file carries `source` and `source_url` fields.

**Fiscal year convention:** the ETL already normalizes to the _ending_ calendar
year ("2016–2017" → `2017`). Public Accounts 2024 = fiscal year ended
2024-03-31. URLs use the ending year (`/federal/spending/2024`); display
strings use "FY 2023–24".

**French source:** the same Vol II pages exist as `-fra.html` mirrors. We do
NOT extend the extractors to parse French HTML (row-matching risk); instead
French comes from the translation pipeline (§8), which uses the official
bilingual open.canada.ca CSVs (they carry `_eng`/`_fra` column pairs) as its
glossary so ministry/entity/category names use official French, and LLM
translation only for free-text line-item descriptions.

## 4. Known accounting differences (the "documented differentiation")

These are structural and must be surfaced, not reconciled away:

1. **Vol I vs Vol II basis.** Consolidated statements (accrual, includes
   consolidated Crown corporations, tax expenditures netted differently) will
   not equal the sum of Vol II appropriations (cash/expenditure basis,
   ministry-by-ministry). The overview page headline uses Vol I; each
   department page footer states its Vol II basis and links to the methodology
   page.
2. **Current site curation.** The existing hardcoded FY2024 tree contains
   hand-massaged aggregations (e.g. negative leaves like COVID-19 Income
   Support −4.84B, thematic groupings that split single ministries). The
   parity report (§10) enumerates every node where generated ≠ current, with a
   reason code: `basis`, `mapping`, `rounding`, `source-correction`.
3. **Machinery-of-government changes.** Ministries renamed/merged across
   2013–2025 (e.g. Indian Affairs → Crown-Indigenous Relations). The ETL's
   normalization map is the canonical crosswalk; department pages for old years
   render under the _current_ (2025) slug with an "In FY XXXX this was
   reported as …" note.
4. **Negative and adjustment rows.** Parenthesized negatives, internal
   consolidation adjustments, and total/subtotal rows are flagged
   (`is_total_or_subtotal`) and excluded from Sankey leaves but retained in
   line-item tables.
5. **Units drift.** Vol I tables in $M, Vol II in dollars, open CSVs in $000s.
   All exported JSON normalizes to **billions for chart data** (matching
   provincial `sankey.json`) and **dollars for line-item tables**, with an
   explicit `units` field.

A new page `/federal/spending/methodology` (static MDX) documents all of the
above, plus the thematic mapping approach and the translation approach.

## 5. Pipeline: `etl/federal/`

Copy from the `public_accounts` repo, keeping Ruby:

```
etl/federal/
├── README.md              # how to run; provenance; update cadence
├── Gemfile                # nokogiri etc. (self-contained bundle)
├── bin/pb                 # CLI
├── lib/                   # extractors + commands (copied, trimmed to what's needed)
├── mappings/
│   ├── thematic_tree.yaml       # curated: thematic node hierarchy + line assignments (§6)
│   ├── ministry_slugs.yaml      # ministry (normalized name) → site slug; preserves the existing 14 slugs
│   └── glossary_fr.yaml         # official EN→FR term pairs harvested from open.canada.ca CSVs
├── prompts/               # LLM prompts for translation + prose (§8, §9)
└── raw/                   # scraped HTML cache (gitignored; ~1.1 GB stays out of git)
```

What is copied vs. left behind:

- **Copy:** the three extractors, `Base`, numeric/fiscal-year parsing,
  ministry-name normalization, the open.canada.ca table downloader (only the
  Vol I tables we need), and their tests.
- **Leave behind:** the 2.3 GB SQLite database, Datasette metadata generation,
  StatCan bulk imports (copy only the CPI fiscal-year multiplier logic), BCID.

New command: `bin/pb export --year 2024 --out ../../data/federal` (and
`--all-years`). Deterministic output (stable key order, fixed float precision)
so JSON diffs are reviewable in PRs.

Raw HTML is fetched on demand by the scrape command and cached locally;
generated JSON in `/data/federal` is the committed artifact, so site builds
never need the raw data or Ruby.

**Validation built into export** (export fails, with a report, if):

- Any non-total Vol II line is unmapped in `thematic_tree.yaml` (§6).
- Sum of Sankey leaves under any node deviates from the node's source total by
  more than $1M.
- A ministry appears in the data with no entry in `ministry_slugs.yaml`.
- Vol I headline total deviates >0.5% from the published consolidated total
  for that year (guards against extractor regressions).

## 6. Thematic mapping (`thematic_tree.yaml`)

The curated artifact that preserves today's narrative tree. Format:

```yaml
themes:
  - id: economy-standard-of-living
    name_en: Economy and Standard of Living
    children:
      - id: health
        name_en: Health
        rules:
          # Rules assign Vol II lines to this node. Most rules operate at
          # ministry or organization level; line-level overrides allowed.
          - ministry: health
          - ministry: crown-indigenous-relations
            organization: "First Nations and Inuit Health Branch"
unassigned_policy: fail # export errors on any unmatched line
```

- Matching precedence: line-level override > organization > ministry.
- A line matched by multiple rules is an export error (no double counting).
- The mapping is reviewed once per new fiscal year; the export failure report
  lists exactly the new/renamed lines needing assignment, so annual
  maintenance is bounded and explicit.
- Initial authoring: seed by reverse-engineering the current FY2024 hardcoded
  tree (node names → `sankeyDepartmentMappings.ts` → ministries), then run the
  parity report until FY2024 matches within documented differences.

## 7. Generated JSON contracts (`/data/federal/`)

Mirrors the provincial convention so `src/lib/jurisdictions.ts` patterns and
Sankey components carry over:

```
data/federal/
├── index.json                      # available years, latest year, ministry list
└── {year}/                         # e.g. 2024 (fiscal year ending)
    ├── summary.json
    ├── sankey.json                 # thematic tree (truncated for chart)
    ├── reconciliation.json         # Vol I ↔ Vol II bridge for this year
    ├── departments/
    │   └── {slug}.json             # one per ministry
    └── i18n/
        └── fr.json                 # translated labels keyed by stable ID (§8)
```

**`summary.json`** — same shape as provincial, federal fields:

```json
{
  "name": "Government of Canada",
  "financialYear": "2023-24",
  "financialYearEnding": 2024,
  "source": "Public Accounts of Canada 2024",
  "source_url": "https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html",
  "units": "billions_cad",
  "inflation": { "baseYear": 2025, "multiplierToBase": 1.031 },
  "totalSpending": 513.94,
  "totalRevenue": 459.53,
  "deficit": -54.41,
  "basis": "vol1_consolidated",
  "ministries": [
    {
      "name": "Finance",
      "slug": "department-of-finance",
      "totalSpending": 136.1,
      "percentage": 26.48,
      "basis": "vol2_appropriations"
    }
  ]
}
```

**`sankey.json`** — existing `SankeyData` shape (`name`/`children`/`amount`,
billions). Thematic tree from §6; revenue side from Vol I revenue tables.
Truncation: each node keeps its top 12 children by |amount|, remainder rolls
into `{ "name": "Other", "amount": …, "isAggregate": true, "count": n }`.
Every node carries a stable `id` (slugified path) used for i18n lookup and
department deep-links (replaces the string-matching in
`sankeyDepartmentMappings.ts`).

**`departments/{slug}.json`**:

```json
{
  "name": "National Defence",
  "slug": "national-defence",
  "financialYearEnding": 2024,
  "basis": "vol2_appropriations",
  "totalSpending": 33.8,
  "percentageOfFederal": 6.6,
  "historicalShare": [ { "year": 2013, "percentage": 6.2 } ],
  "miniSankey": { "spending_data": { "...top-N + Other tree..." } },
  "entities": [ { "name": "Department of National Defence", "value": 26.5 } ],
  "votes": [
    { "vote": "Vote 1", "description": "Operating expenditures",
      "totalAvailable": 18712345678, "used": 18201234567, "lapsed": 511111111 }
  ],
  "transferPayments": [
    { "category": "Contributions", "description": "…", "used": 123456789,
      "id": "nd-2024-tp-0042" }
  ],
  "lineItemsUnits": "dollars_cad"
}
```

`historicalShare` is computed across all extracted years at export time (Vol II
ministry total ÷ Vol I total per year) — replaces the hardcoded 1995–2024
arrays for 2013+ (pre-2013: §12).

**`reconciliation.json`** — machine-readable bridge rendered on the
methodology page and in per-page footnotes: Vol I total, sum of Vol II
ministry totals, and enumerated named differences (consolidation adjustments,
accrual items, netted revenues).

## 8. French (i18n)

- UI chrome stays on Lingui exactly as today.
- Data labels are translated by a pipeline step, **not** at build/runtime:
  1. Export emits every EN label with its stable `id`.
  2. Glossary pass: ministry names, entity names, vote types, transfer
     categories, standard phrases resolve from `glossary_fr.yaml` (harvested
     from the official bilingual open.canada.ca CSVs — exact official French).
  3. LLM pass (Claude API): remaining free-text line-item descriptions,
     translated with the glossary injected as required terminology and
     Canadian-government register specified. Only _new or changed_ IDs are
     translated on re-runs; existing translations are stable.
  4. Output committed as `data/federal/{year}/i18n/fr.json` → normal PR
     review.
- LLM-generated prose translations (§9) go through the same commit-and-review
  path.
- The site loader picks `fr.json` labels by node `id` when `lang=fr`, falling
  back to EN with a `lang="en"` attribute on untranslated strings.

## 9. Department prose (LLM-generated, per department × year)

- Generated by a pipeline command (`bin/pb prose`), not at site build. Output:
  `data/federal/{year}/departments/{slug}.prose.{en,fr}.md` — committed,
  diff-reviewed.
- **Guardrails** (this is civic copy; confidently-wrong is worse than absent):
  - The prompt receives only that department-year's exported JSON; the model
    must not introduce figures absent from it.
  - All dollar figures and percentages in prose are written as placeholders
    (`{{totalSpending}}`, `{{topProgram.name}}`) interpolated from JSON at
    render time — the LLM writes structure and context, never the numbers.
    A lint step rejects prose containing literal `$` figures.
  - A verification pass (second model call) checks every factual claim against
    the JSON and flags unsupported claims into the PR description.
  - The 14 existing hand-written FY2024 pages are kept as the FY2024 prose for
    those departments (they're better than generated copy); generation fills
    the other years and the other ministries.
- Prose ships behind per-file review: a department-year with unreviewed prose
  renders stats-only, so prose review never blocks a data update.

## 10. Site changes (`src/`)

**Routes** (App Router, replacing the 14 hardcoded folders):

```
src/app/[lang]/(main)/federal/spending/
├── page.tsx                        # redirects/renders latest year (canonical)
├── methodology/page.mdx            # NEW
├── [year]/
│   ├── page.tsx                    # overview for that year
│   └── [department]/page.tsx      # department page
src/app/[lang]/(mobile)/federal/spending-full-screen/[year]/page.tsx
```

- `generateStaticParams` from `data/federal/index.json` (years × ministries),
  `dynamicParams: false` — same pattern as provincial.
- **URL compatibility:** existing URLs keep working —
  `/federal/spending` → latest year; `/federal/spending/department-of-finance`
  → `/federal/spending/{latest}/department-of-finance` via `redirects()` in
  `next.config.ts` (the 14 legacy slugs enumerated; slugs themselves are
  preserved by `ministry_slugs.yaml`).
- Guard against the year segment being swallowed as a department slug: years
  are `20\d\d` and validated against `index.json`.

**Year toggle:** a `YearSelector` component (links, not client state — each
year is its own static page) rendered on overview and department pages;
disabled years greyed out. Department pages link to the same department in
other years; if a ministry doesn't exist in a target year (machinery changes),
link to that year's overview with a notice.

**Loader:** `src/lib/federal.ts` following `jurisdictions.ts`
(`getFederalYears()`, `getFederalSummary(year)`, `getFederalSankey(year,
lang)`, `getFederalDepartment(year, slug, lang)`); applies `fr.json` label
substitution server-side.

**Components:**

- `Sankey/index.tsx`: delete the ~800-line inline tree; feed from
  `sankey.json`. `sankeyDepartmentMappings.ts` replaced by node `id` → slug
  from data.
- `useDepartments` replaced by `summary.json.ministries`.
- Department page composed from generic components fed by
  `departments/{slug}.json`: `DepartmentMiniSankey`, `FederalSpendingByEntity`
  (→ generic `BarList`), `FederalSpendingChart` (→ generic `LineChart` on
  `historicalShare`), `StatCard`s, plus NEW `LineItemTable` (searchable,
  paginated votes + transfer payments; CSV download) backing the top-N+Other
  truncation.
- `UpdatedAt` fed from export metadata.
- Every page footer: basis note + link to methodology.

**Build:** extend `scripts/generate-statics.ts` to include federal years in
`static-data.json`.

## 11. Parity verification (FY2024)

Before switching over, an automated comparison of generated FY2024 output vs.
the current hardcoded values:

- Script extracts the current inline trees (`Sankey/index.tsx`,
  `useDepartments`, each department's `MiniSankey`/entities/chart data) into a
  fixture — the "current" baseline.
- Compares against generated JSON node-by-node; emits
  `docs/specs/federal-parity-report-2024.md` listing every mismatch with a
  reason code (§4.2).
- Acceptance: every mismatch has a reason code and appears on the methodology
  page (aggregated by category); no `unexplained` rows remain.

## 12. Rollout

1. **Phase 1 — pipeline:** copy ETL into `etl/federal/`, add `export`, author
   `ministry_slugs.yaml` + seed `thematic_tree.yaml`, generate FY2024 EN JSON,
   run parity report, iterate mapping until clean.
2. **Phase 2 — site (EN, FY2024):** new routes + loader + components behind the
   existing URLs; ship when parity report is fully explained. Old hardcoded
   pages deleted in the same PR (no dual maintenance).
3. **Phase 3 — all years:** export 2013–2025, resolve mapping for historical
   lines, ship year toggle + redirects.
4. **Phase 4 — French + prose:** glossary harvest, translation run, prose
   generation + review, ship `fr` parity.

### Resolved questions (2026-07-05)

- **Pre-2013 historical share:** static `data/federal/historical_pre2013.json`
  sourced from the current hardcoded arrays (provenance: Fiscal Reference
  Tables). No PDF extraction.
- **Revenue detail:** statement-level only this phase.
- **Default year:** FY2025.
- **Inflation:** CPI real/nominal toggle shipped in this phase (multiplier in
  `summary.json`, client-side scaling).
