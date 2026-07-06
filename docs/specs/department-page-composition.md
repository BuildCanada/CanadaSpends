# Spec: Department page composition — prose sections + standard-object miniSankey

**Status:** Approved
**Date:** 2026-07-06
**Parent spec:** federal-public-accounts-pipeline.md; supersedes the
miniSankey tree shape from mini-sankey-legibility.md (vote naming work is
retained for `votes[]` / the line-item table).

## Part A — Prose section markers (page composition)

### Problem

The old production pages interleaved narrative with the numbers: intro prose
under the H1, stat cards, more prose, the budget-breakdown chart, prose,
entity chart, historical chart. The new template renders all prose as one
block after the stat cards, which reads worse.

### Design

Prose markdown becomes the page script. A line containing only a section
token places that page component at that position:

```
{{section:stats}}          — headline StatCards + inflation toggle section
{{section:miniSankey}}     — "How did X spend its budget" chart section
{{section:entities}}       — "Spending by entity" section
{{section:historicalShare}}— share-of-federal-spending line chart section
{{section:lineItems}}      — line-item table section
```

Rules:

1. The department page splits the (reviewed) prose on these tokens and
   renders alternating prose fragments and component sections in file order.
   Text before the first token renders right under the H1/year selector
   (the production "intro" position).
2. Any component NOT referenced by a token is appended after the scripted
   content, in today's default order — a file using only `{{section:stats}}`
   still gets every chart. Duplicate tokens: first occurrence wins, later
   ones are ignored.
3. No prose file, or prose not `reviewed` → exactly today's default layout
   (this remains the contract for unreviewed/generated years).
4. Tokens are consumed by the splitter before placeholder interpolation and
   comment stripping; the existing figure placeholders are unchanged.
5. The prose pipeline lint (etl/federal, and its prompts/prose.md) must
   whitelist section tokens; generated prose SHOULD emit a sensible default
   script (intro ¶ → stats → context ¶ → miniSankey → shape-of-spending ¶ →
   remaining defaults). Do not regenerate historical prose files now — the
   no-token fallback covers them.

### Hand-written FY2024 files

Update all 14 hand-written department prose pairs (en+fr identically) to
insert tokens reproducing each department's ORIGINAL production order —
recover it per department from `git show main:"src/app/[lang]/(main)/federal/spending/{slug}/page.tsx"`
(order of <Intro>/<P> vs StatCards/MiniSankey/FederalSpendingByEntity/
FederalSpendingChart in the original JSX).

## Part B — Standard-object miniSankey (restore the better breakdown)

### Problem

The vote/allotment miniSankey (even with described labels) is less
informative than the old production breakdown by STANDARD OBJECT
(Personnel, Professional and special services, Acquisition of machinery and
equipment, …, with negative internal/external revenue leaves).

### Source (verified)

Official open.canada.ca dataset "Ministerial Expenditures by Standard Object
as per the Public Accounts of Canada" (uuid `9c4bcc95-bd73-4476-b86f-03553d489a45`),
one CSV per Public Accounts year, available back past 2014 — INCLUDING
2016–2018, so this breakdown has no coarse-year gap:

- ≤2023 editions: `https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/dmac-meso/dmac-meso-{year}-eng.csv`
  (+ `-fra.csv` with official French labels)
- 2024, 2025: `.../dmac-meso-{year}.csv` (single bilingual-header file)

Shape (verified on 2023): rows = ministry portfolio × organization; columns
`Std-obj1..Std-obj12`, `External-revenues`, `Internal-revenues`; units
`x1000`. Column → object-name mapping MUST be taken from the dataset's data
dictionary (etl/federal/open_tables/mapping/cp-pa-dd.xml or the Vol II
table 3 HTML header), not assumed. Download the needed years into
etl/federal/open_tables/data/ (un-ignore them; keep -fra editions for the
official French labels).

### Target tree

`department → organization → standard object` leaves, via the existing
Truncation (top-N + Other). External/Internal revenues are emitted as
NEGATIVE leaves named "External revenues" / "Internal revenues" (matching
the old chart). Amounts leaf-only (hard contract). Vote/allotment data
continues to feed `votes[]` and the line-item table unchanged; add
`"breakdown": "standard_object"` inside `miniSankey` for UI/labeling use.

### Reconciliation & validation

- Ministry rows resolve through the same slug mapping (ministry_slugs.yaml,
  incl. organization overrides for the RDA merge — PacifiCan/FedDev/CanNor
  rows must land in regional-economic-development, NOT their host
  portfolios; extend org-override handling to this dataset).
- Validate per department-year: |standard-object net total − allotment
  expenditure total| within 2% or $50M (whichever larger); failures block
  the year with a written report line. Systematic small deltas (gross/net
  timing) get a one-line note on the methodology page.
- Deterministic output; `bundle exec rake` green with new tests (column
  mapping, negative revenue leaves, RDA reattribution, tolerance check).

### French

Object names come from the -fra CSV editions (official). Wire them through
the existing driver+merge (union chunk if needed); finish at 100% coverage.

## Acceptance

1. DND FY2024 miniSankey shows Personnel / Professional and special
   services / Acquisition of machinery and equipment / … with negative
   internal+external revenue leaves — matching the old production chart's
   shape (org level retained above objects).
2. All 12 years re-export deterministically with the tolerance validation
   passing (or documented exclusions).
3. FY2024 department-of-finance (or national-defence) page renders prose
   interleaved per its original production order, EN and FR; a year with
   unmarked generated prose (e.g. 2019) renders today's default layout.
4. fr label coverage 100%; `bundle exec rake` green; tsc/eslint no new
   errors; live check EN+FR.
