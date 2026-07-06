# Spec: Main federal page fully on the Vol I accrual basis

**Status:** Approved
**Date:** 2026-07-06
**Parent specs:** consolidated-statement-alignment.md (headline),
federal-public-accounts-pipeline.md §7.

## Goal

Every number on `/federal/spending/[year]` — stat cards, the thematic Sankey
(themes and leaves), and the ministry list — is on the Volume I consolidated
accrual basis and sums to the published totals exactly. The
`accounting-basis-adjustments` leaf disappears (guarded: only re-emitted if a
residual > $1M ever appears, which the validations should prevent).
Department pages remain Volume II appropriations (line-level detail exists
only there); the existing basis banner marks that seam and the methodology
explains it.

## Source (verified)

Vol I Table 3.6 "External expenses by segment and by type" — official
open-data CSVs (`cest-eest-{year}.csv`, e.g.
`https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/cest-eest/cest-eest-2024.csv`).
FY2024 verified: rows = segment × portfolio × expense type
(`Major transfer payments`, `Other transfer payments`, `Public debt charges`,
`Other expenses`), units x1000, bilingual columns. Segments: "Ministerial
portfolios" (~30 portfolios) plus standalone "Net actuarial losses" and
"Provision for valuation and other items". The full set sums to the published
total expenses ($521,425M for FY2024). Portfolio totals INCLUDE the
tax-system/statutory transfers (ESDC 124,372 contains OAS+EI; National
Revenue 59,914 contains children's benefits + carbon rebate), so the existing
vol1-node offset mechanism applies on this basis too. Verify year coverage
2014–2025 via the CKAN dataset (find the uuid from
open_tables/mapping/table_mapping.csv row for table 3.6); download EN+FR (or
bilingual single-file) editions for all available years, un-ignore, document
provenance. If a year lacks the table, that year keeps the current mixed
basis WITH its adjustments leaf, documented — do not fake it.

## Design

1. **New reader** `PbCli::Export::SegmentExpenses` (pattern: StandardObjects):
   per year, portfolio → {major_transfers, other_transfers, debt_charges,
   other_expenses, total}, plus the non-ministerial segments. Validate:
   Σ(all segments) == Vol1Statement total_spending ± $1M (hard check).
2. **Portfolio → slug mapping**: reuse/extend the alias machinery
   (`meso_portfolio_aliases`-style) for 3.6's portfolio wording. Segments and
   our slugs are N:M:
   - A segment covering several slugs (e.g. if RDAs or PacifiCan sit inside a
     host portfolio): allocate the segment total across its slugs in
     proportion to their Vol II expenditure shares that year.
   - A slug spanning several segments: sum them.
     Every portfolio must resolve (export-blocking otherwise).
3. **Ministry list** (`summary.ministries`): totalSpending = the slug's
   accrual allocation; percentage = share of the published total; add
   `basis: vol1_segment_accrual`. APPEND two non-ministry rows so the list
   sums to the headline exactly: "Net actuarial losses" and "Provision for
   valuation and other items" (no slug/href — the site renders them as
   non-link rows). Keep each department page's own Vol II figures unchanged.
4. **Thematic Sankey re-based**: each slug's contribution to its thematic
   nodes is its ACCRUAL total allocated across the slug's existing Vol II
   theme assignments pro-rata (the scale-to-line technique already used for
   CHT). Vol1 statement nodes (OAS, EI, CCB, carbon rebate, CHT/CST/
   equalization, debt charges, COVID items, actuarial) keep their exact
   statement amounts; offsets subtract from the owning slug's accrual
   allocation instead of the Vol II lump (post-offset guard stays: no
   catch-all below −$1M). Add a leaf for "Provision for valuation and other
   items" (suggest: under Obligations, next to actuarial). The spending
   tree's leaf sum MUST equal summary.totalSpending with NO adjustment leaf.
   Sub-ministry leaves are now allocated (not literal Vol II lines) — the
   methodology page must say so plainly.
5. **Site**: overview caption "Ministry totals are on a Volume II
   appropriations basis…" changes to accrual wording with a note that
   clicking through shows appropriations detail; ministry list renders the
   two non-link statement rows; new strings via Lingui EN+FR (fr.po stays
   0 missing). Department pages untouched except no reliance on
   summary.ministries for their own figures (verify).
6. **Docs**: methodology (allocation method, the seam to department pages,
   removal of the adjustments node), parity report re-run (theme totals
   shift again — reason-code `basis`), NOTES.md.
7. **Tests**: SegmentExpenses reader; N:M allocation; ministry-list sums to
   headline; tree==headline with no adjustments leaf; updated theme pins
   with citations (obligations now includes actuarial + provision); FY2024
   ministry examples (ISC accrual ≈ 23.885 + CIRNAC 20.864 → their slugs'
   allocations); deterministic export; full rake green.
8. **French**: portfolio/segment labels from the FR edition; driver+merge to
   100%; "Provision for valuation and other items" official French from the
   CSV.

## Acceptance

1. FY2024 overview: stat cards 521.425/459.549/61.876; Sankey spending
   leaf-sum == 521.425 with NO accounting-basis-adjustments leaf; ministry
   list rows sum to 521.425 including the two statement rows; ISC-slug row
   shows its accrual allocation (≈ $44.7B for the combined
   indigenous-services-and-northern-affairs slug), not the Vol II $63.0B.
2. All years export deterministically; segment-sum and tree-sum validations
   pass (or a year is documented as fallback-basis).
3. Live EN+FR overview renders the new list and captions; department pages
   unchanged (ISC dept page still shows Vol II $63.0B with its basis banner).
4. rake green; tsc/eslint no new errors; fr catalogs 0 missing.
