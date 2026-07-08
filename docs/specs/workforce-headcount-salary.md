# Spec: Per-year federal workforce (headcount + salary) data

**Status:** Approved
**Date:** 2026-07-08
**Parent spec:** federal-public-accounts-pipeline.md (workforce was a
non-goal; this supersedes that for headcount/salary series).

## Goal

Every federal year (2014–2025) carries workforce data — headcount and
personnel cost — in `data/federal/{year}/`, sourced and reproducible, and the
overview page shows the selected year's figures (not just a hardcoded
latest-year blurb).

## Sources

1. **Headcount**: TBS "Population of the federal public service" annual
   tables on canada.ca (population as of March 31 → maps to our fiscal-year
   ending convention). Prefer the department-level table if it parses
   cleanly (enables future per-department workforce); government-wide totals
   are the requirement. Build a re-runnable scraper in the pb CLI
   (`pb workforce`), writing a committed reference file
   `etl/federal/reference/workforce.json` with provenance (URL, retrieved
   date). If the page structure resists automation, manual extraction into
   the same reference file is acceptable (per-user authorization) — record
   values verbatim with the source URL; prefer the scraper.
2. **Personnel spending**: already in the repo — the meso standard-object
   "Personnel" figures (net presentation, consistent with everything else).
   Government-wide personnel = Σ portfolios' Personnel object per year.
3. **Average personnel cost** = personnel spending ÷ headcount, labeled as
   "average personnel cost per employee (salaries and benefits)" — NOT
   "average salary" (Personnel includes benefits/allowances).

## Output

- Exporter merges the reference file into per-year output:
  `data/federal/{year}/workforce.json`:
  `{ headcount, headcountAsOf: "YYYY-03-31", personnelSpending (B),
   averagePersonnelCost (dollars), source, source_url }`
  plus a `headcountByDepartment` map when the department table parsed
  (slug-resolved via the existing mapping where names match; unresolved
  names kept under their TBS label — do not force).
- Validation: every exported year must have headcount data or the year's
  workforce.json is omitted with a report line (do not fake).

## Site

- Overview page: a "Federal workforce" strip for the SELECTED year — stat
  cards (headcount, personnel spending, average personnel cost) + a
  headcount-over-time line chart (all years, current year highlighted).
  Renders whenever that year's workforce.json exists.
- The existing hardcoded demographics section (age/tenure/salary
  distribution charts, 2019–2023 vintage) stays latest-year-only and keeps
  its caveat; place the new strip above it. Personnel-spending figures
  participate in the inflation toggle; headcount does not.
- Lingui EN+FR for new strings (fr.po 0 missing).

## Acceptance

1. `data/federal/{year}/workforce.json` exists for every year the TBS data
   covers (expected: all 12), with plausible values (headcount ~250–370k).
2. Overview for 2016 and 2025 shows that year's headcount/personnel figures;
   the line chart renders; FR renders.
3. Scraper re-runnable + tests (parse fixtures, merge logic, average
   computation); full rake green; deterministic export; tsc/eslint clean;
   live check EN+FR.
