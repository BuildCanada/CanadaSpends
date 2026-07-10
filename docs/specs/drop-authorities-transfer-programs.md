# Spec: Drop authorities from pages; break transfers into programs

**Status:** Approved
**Date:** 2026-07-08
**Parent specs:** main-page-accrual-basis.md, department-page-composition.md.

## Problem

Department pages still mix two Vol II presentations: the stat card, entity
list, and share figures come from parliamentary AUTHORITIES (votes/allotments,
gross of revenue netting) while the standard-object chart on the same page is
net of revenues — PSPC shows a $10.68B card over an $8.29B chart (−22%),
Treasury Board −18%, Justice −18%. The votes/available/used/lapsed table adds
a third concept (authorities granted vs spent) that confuses more than it
informs. Separately, the chart's "Transfer payments" object is an opaque lump
even though the Public Accounts name every transfer program.

## Decision

Authorities disappear from user-facing pages "for now". Every figure a
reader sees on a department page comes from ONE presentation: net
expenditures by standard object (the same data the chart draws), so pages
are internally consistent and consistent with each other. The transfer-
payments object fans out into named programs.

### 1. Department figures move to the standard-object (net) basis

In `departments/{slug}.json` (exporter):

- `totalSpending`, `percentageOfFederal` (÷ Vol I total), `entities[]`
  (org net totals), and `historicalShare` (all years 2014–2025) are computed
  from the meso dataset (net = Σ objects − external/internal revenues),
  matching the miniSankey exactly. `basis` becomes `vol2_standard_object_net`
  with the page banner/intro reworded ("net expenditures by standard object,
  Public Accounts Volume II"; FR equivalent).
- `votes[]` is REMOVED from the JSON and the site: LineItemTable loses the
  Votes & allotments tab (component keeps its name; transfers tab becomes the
  only view; CSV download = transfers). Remove now-dead vote-only code paths
  (split_vote stays if the transfers/miniSankey pipeline still uses it —
  check; delete truly dead code rather than leaving it).
- `transferPayments[]` stays (it is the program-level breakdown of the
  transfer object). `reportedAs` now derives from the meso portfolio label
  for the year when it differs from the display name.
- historical_pre2013.json merge behavior unchanged.

### 2. Transfer programs inside the miniSankey

Under each organization, the "Transfer payments" standard-object leaf fans
out into named program children from the transfer-payments dataset:

- The transfers dataset is ministry-keyed (no organization column). Attach
  program children to the organization holding the LARGEST transfer-payments
  object, and only when that org holds ≥90% of the portfolio's total
  transfer-object amount (true for almost all portfolios: the department org
  pays the transfers). Otherwise leave the object leaves unsplit (log which
  portfolios/years skip, in the export report).
- Program amounts are scaled pro-rata to the object's (net) amount —
  scale-to-line, methodology-disclosed — with existing Truncation
  (top-N + "Other transfer programs") and exact sums. Zero rows dropped.
- Stable ids (`{slug}-{year}-{org}-tp-{n}` reusing the transferPayments ids
  where possible so existing French resolves); amounts leaf-only.
- FY2024 National Defence acceptance: the transfer object (~$1.1B) splits
  into its contribution programs (e.g. NATO programs) + Other.

### 3. Main page / internals

The overview stays exactly as shipped (Vol I accrual). Internal pro-rata
weights for segment→slug and theme allocation: switch to meso org/portfolio
shares where the rule granularity allows (bonus: real weights for 2016–2018);
keep allotment-derived weights ONLY where a thematic rule genuinely needs
line-level data — enumerate any such remaining uses in NOTES.md. The
allotment dataset remains in the repo (it may return later); nothing
user-facing reads it after this change.

### 4. Prose sweep

Grep all prose (en+fr, all years) for wording that now contradicts the pages
("appropriations basis", vote counts, "appropriation vote(s)", authorities):
rewrite the affected sentences minimally (keep reviewed status for
hand-written/reviewed files but note the edit in their audit comment; keep
reviewed: false files as-is otherwise). The dept-page <Intro> and basis
footnote strings change (Lingui EN+FR, catalogs 0 missing).

### 5. Docs/tests

Methodology: rewrite the department-basis section (authorities removed from
pages, net standard-object presentation, transfer-program scaling); parity
report re-run (department totals shift again — reason `basis`); NOTES.md.
Tests: update dept-shape pins (no votes[], net totals — PSPC 2024 ≈ 8.285,
card==chart identity for every dept-year as a bulk assertion), transfer-
program fanout (DND 2024), ≥90% attachment rule, historicalShare from meso.
Full rake green; deterministic export; tsc/eslint no new errors.

## Acceptance

1. Every department page FY2014–2025: stat card == miniSankey leaf-sum ==
   entities sum (bulk-verified in tests); no votes UI anywhere; banner says
   the net standard-object basis.
2. DND FY2024 chart shows named transfer programs under the transfer object.
3. Overview unchanged (still sums to the published totals everywhere).
4. French 100% (program-node names resolve from the existing corpus);
   fr.po 0 missing; live EN+FR checks on PSPC 2024 (card $8.29B) and DND 2024.
