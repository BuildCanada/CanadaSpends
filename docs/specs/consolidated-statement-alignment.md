# Spec: Align headline, Sankey, and Vol I consolidated statement

**Status:** Approved
**Date:** 2026-07-06
**Parent spec:** federal-public-accounts-pipeline.md §4/§7

## Problem (verified against the cdeif-tycfi CSVs)

1. **Headline ≠ published Vol I.** `Vol1Statement#total_spending` sums the
   statement's level-1 "Expenses" section only. "Net actuarial losses" is its
   own level-1 section, so headline spending excludes it — FY2024 shows
   $513.94B / implied deficit $54.4B, while the published statement is total
   expenses **$521.4B** and Annual operating deficit **$61.876B**. (The old
   hand-curated site had the same exclusion; we anchored to it.)
2. **Actuarial losses mis-signed and misplaced.** The CSV stores the section
   with an inverted sign (FY2024 `-7489` = a $7.489B LOSS/expense; FY2025
   `-4020`). The exporter passes the raw sign through, rendering a negative
   "Net actuarial losses" leaf buried in a catch-all theme. The user wants it
   as a proper cost category.
3. **Sankey ≠ headline.** The spending tree total (mixed Vol II gross +
   Vol I items, e.g. $532.3B in FY2024) doesn't equal the headline, and some
   years carry a "Surplus" padding leaf inside spending (FY2014 shows a
   $13.77B "Surplus" node) inherited from the old curated tree.

## Target

For every exported year, these MUST agree exactly (±$1M):

```
summary.totalSpending  == Vol I total expenses INCLUDING net actuarial losses
summary.totalRevenue   == Vol I total revenues
summary.deficit        == the statement's Annual operating deficit line
                          (sign convention: positive = deficit, negative = surplus)
sankey spending_data leaf sum == summary.totalSpending
sankey revenue_data  leaf sum == summary.totalRevenue
```

### Changes

1. **Vol1Statement**: expose `total_spending` = Expenses section + net
   actuarial losses (sign-normalized so a loss is a positive expense),
   `total_revenue` unchanged, and `published_deficit` read from the "Annual
   operating deficit" line (normalize sign: CSV stores it negative). Add an
   internal-consistency assertion per year:
   `total_spending − total_revenue == published_deficit ± $1M` — a hard
   export validation. Verify the sign conventions hold in the OLDER CSV
   edition too (cdeif-tycfi-2023 covers FY2014–2023) — do not assume.
2. **summary.json**: totalSpending / totalRevenue / deficit become the
   published values. `deficit` stays "revenue minus spending" NO LONGER —
   redefine as the published deficit (positive = shortfall) and update the
   overview StatCard: label reads "Deficit" with the positive amount when in
   deficit and "Surplus" with the positive amount when in surplus (some
   years, e.g. FY2015, are surplus years). Update PUBLISHED_TOTALS anchors:
   FY2024 spending 521.425 / revenue 459.549 (tolerance unchanged) — the old
   513.94 anchor is retired deliberately.
3. **Net actuarial losses as a cost category**: relocate the
   `net-actuarial-losses` node to sit directly under the `obligations` theme
   (alongside net interest on debt), amount sign-normalized (FY2024 =
   +7.489B; a genuine actuarial GAIN year would be negative, which is
   acceptable and truthful). Remove it from its current location. Update the
   Wave 2.5 test pins (−7.489 → +7.489 under obligations; obligations theme
   total becomes ≈ 54.76 for FY2024).
4. **Remove padding**: delete any `surplus`/`deficit` balancing nodes from
   thematic_tree.yaml / the exporter (the FY2014 "$13.77B Surplus" leaf).
   The visual gap between the two columns IS the deficit/surplus, as on
   provincial pages.
5. **Reconciling leaf so the tree sums to the headline**: after building the
   thematic spending tree, compute
   `residual = totalSpending − (sum of all spending leaves)` and emit ONE
   top-level leaf `id: accounting-basis-adjustments`,
   name "Accounting and consolidation adjustments" (may be negative —
   FY2024 ≈ −10.9B). It represents the Vol II gross vs Vol I consolidated
   difference already documented in reconciliation.json; link the two: the
   reconciliation.json `difference` and this leaf must be consistent, and
   the methodology page gets a short paragraph explaining the node.
   Threshold: if |residual| < $1M emit nothing.
6. **Revenue side**: verify it already sums to totalRevenue (it is built
   from the statement); if the statement rows changed with the actuarial fix,
   keep it exact.
7. **Docs/parity**: methodology page updated (actuarial category + the
   adjustments node + the headline now matching the published statement);
   parity report gets a new reason-coded row set for the headline change vs
   the old site (reason: source-correction — the old site under-reported
   total expenses by excluding net actuarial losses); NOTES.md updated.
8. **French**: new labels ("Accounting and consolidation adjustments",
   StatCard "Surplus" label, methodology additions) via Lingui extract +
   driver/merge to 100%.

## Acceptance

1. FY2024: summary shows spending $521.43B, revenue $459.55B, deficit
   $61.88B — and the spending Sankey column total equals $521.43B with
   "Net actuarial losses" ≈ +$7.49B visible under Obligations and an
   "Accounting and consolidation adjustments" leaf ≈ −$10.9B.
2. Every exported year passes the new consistency validations (or the year is
   excluded with a written reason).
3. FY2015 (surplus year) renders a "Surplus" StatCard, and no year has a
   Surplus/padding node inside the Sankey.
4. `bundle exec rake` green (update pinned tests deliberately, with comments
   citing the published statement values); export deterministic; live check
   EN+FR on 2024 + 2015; tsc/eslint no new errors.
