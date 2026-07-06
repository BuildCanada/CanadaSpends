# Mapping notes — ambiguities, judgments, and known parity differences

Authored 2026-07-05 alongside `ministry_slugs.yaml` and `thematic_tree.yaml`.
Every item below is a checklist entry for the FY2024 parity-report phase.
Coverage status: `ruby check_coverage.rb` → 0 unmatched rows across both
datasets, all years 2013–2025.

## Architectural note for the export implementer (important)

`budgetary_details_by_allotment` and `transfer_payments_by_ministry`
**overlap**: transfer payments are the detail of transfer-payment votes that
already appear in the allotment data. Feed the Sankey/summary from the
**allotment dataset only**; use the transfer-payments dataset only for the
department pages' `transferPayments` tables. Summing both double-counts.

Also: the transfer-payments dataset has **no `organization` field**, so
organization-level rules cannot match those rows — they resolve at
ministry level. This is fine given the above (TP rows never feed the tree).

## Data-quality quirks the slug map absorbs

- Extraction artifacts mapped as explicit name variants: `inance` (Finance,
  2020–21), `Agriculture and Agri` (2013–15), `Agriculture and Agri‑Food`
  (non-breaking hyphen), `Infrastructure et Collectivités` (French leak,
  2024).
- Rows with `ministry_name_normalized: null` (2014–15, codes ec / mdn-dnd /
  justice / gg / bsgg-oggs) and page-title noise `"Public Accounts of
Canada"` (codes ic 2016, gn-dg 2020–21, edip-ewddi 2021–22) resolve via the
  `overrides:` section by ministry_code.
- **Code collision:** `ic` = Industry (early years) AND Infrastructure and
  Communities (later years). Never resolve `ic` by code except the pinned
  2016 noise override; names disambiguate everywhere else.
- `consolidated` code (2013–14 Vol III pages) is shared across portfolios —
  resolve by name only.

## Slug decisions

- `indigenous-services-and-northern-affairs` aggregates the ISC **and**
  CIRNAC ministries (plus pre-split INAC) — matches the existing combined
  site page. The thematic tree still splits them via `ministry_name` rules.
- `canada-revenue-agency` ← ministry "National Revenue" (official portfolio
  name most years).
- `prairies-economic-development` merges Western Economic Diversification
  (≤2021) with its successor PrairiesCan.
- Shortened slugs (deviation from strict kebab-of-name, for URL sanity):
  `economic-development-quebec`, `prairies-economic-development`,
  `northern-economic-development`.
- `democratic-institutions` gets its own slug/page (it is a distinct Vol II
  ministry in 2019–2024) even though the thematic tree folds it into
  Safety → Elections.
- `parks-canada` appears as its own ministry only in some years; other years
  it is an organization under Environment. Both routes land in the
  `national-parks` node; the department page only exists in its standalone
  years.

## Top risky mapping judgments (verify in parity phase)

1. **Finance catch-all → Other Major Transfers.** The Finance department's
   operating spend and any un-enumerated statutory line lands in
   `other-major-transfers`. Line regexes pull out CHT/CST/Equalization/QC
   abatement/debt interest; verify against FY2024 that the residual ≈ the
   current tree's "Other Major Transfers" ($17.6B) and that no large
   statutory item (e.g. Territorial Formula Financing — intentionally in the
   residual) is misplaced.
2. **Net Interest on Debt** is fed by line regex
   (`interest on unmatured debt|other interest costs|interest and other
costs`) on Finance — Vol II gross statutory interest will NOT equal the
   current tree's Vol I _net_ $47.27B. Documented basis difference; confirm
   magnitude.
3. **OAS line regex** (`old age security|guaranteed income supplement|
allowance payments`) carves Retirement Benefits out of the ESDC
   catch-all. If a year words these lines differently, amounts silently stay
   in Employment + Training — the parity check on `social-security` totals
   is the guard. EI and CCB are `source: vol1` (not in appropriations), so
   the generated Social Security node needs Vol I feeds before it matches
   the current $120B+ scale.
4. **Vol I–only nodes** (`carbon-tax-rebate`, `employment-insurance`,
   `childrens-benefits`, `covid-income-support`,
   `canada-emergency-wage-subsidy`, `net-actuarial-losses`) require the
   export command to source specific Vol I consolidated lines; the
   `vol1_hint` strings name the concepts but the exact open.canada.ca table
   columns still need to be pinned.
5. **Defence program leaves.** Current tree shows DND departmental-results
   programs (Ready Forces, Defence Procurement…). Vol II gives votes/
   allotments instead — generated children will differ by construction.
   Same applies to ISED's "Investment, Growth and Commercialization" and
   ECCC's Weather Services / Nature Conservation leaves (program-level
   curation not recoverable from Vol II).

## Smaller judgments

- CBSA (org under Public Safety ministry) → Immigration + Border Security,
  matching the current tree.
- Office of the Chief Electoral Officer + Leaders' Debates Commission +
  ministry Democratic Institutions → Safety → Elections node (current tree
  puts the CEO under Public Safety).
- NSICOP Secretariat appears under both Parliament and Democratic
  Institutions in different years → follows its ministry's catch-all
  (inconsistent across years; immaterial, ~$3M).
- Canadian Intergovernmental Conference Secretariat sits under Global
  Affairs (some years) and Public Safety-DI (2024) → follows ministry
  catch-all; theme flips across years (~$6M, noted not fixed).
- Canadian Transportation Accident Investigation and Safety Board (PCO
  ministry) → Transportation node.
- Office of the Auditor General (Finance ministry) → NEW node
  `audit-agents` under Functioning of Government (no counterpart in the
  current tree — will appear as an addition in the parity report).
- Office of the Commissioner of Official Languages sits under the Public
  Safety ministry in 2024–25 → lands in Community Safety via catch-all
  (odd but faithful to Public Accounts structure).
- PacifiCan under Privy Council ministry (2024) → carved to
  Community and Regional Development by org rule; FedNor under Indigenous
  Services (2025) likewise.
- Canada Post, National Capital Commission → PSPC catch-all ("Other Public
  Services + Procurement").
- EDC (Canada Account), CCC, Invest in Canada Hub, IDRC → Global Affairs
  catch-all (International Affairs), consistent with current tree's "Other
  International Affairs Activities" bucket.
- Ministries whose FR names were truncated in the source CSVs were completed
  from official usage: ESDC, HICC, Fisheries/Coast Guard, ACOA, PrairiesCan,
  CanNor, EDQ (verify against a French Vol II page during the FR phase).

## historical_pre2013.json

Extracted from the 10 department folders that have `FederalSpendingChart.tsx`
(1995–2012 points only; HICC's series starts 2006). Four current pages have
no historical chart and hence no entry: innovation-science-and-industry,
veterans-affairs, transport-canada, immigration-refugees-and-citizenship.

## Wave 2.5 parity results (FY2024, $B)

Statutory items lumped inside Vol II "Statutory amounts" rows are now
re-sourced from Vol I (statement CSV / Table 3.7 dataset) and offset against
the Vol II catch-alls via `offset_node` — see the rule-key docs at the top of
`thematic_tree.yaml`. CHT/CST province children are pro-rated to the accrual
statement line (`scale_to_line`), exactly as the current site did. The
net-actuarial sign flip was removed (the statement stores −7.489 for FY2024
and the site shows −7.49; the flip was a bug). **Superseded 2026-07-06** by the
consolidated-statement alignment (see the dated section below): net actuarial
losses are now INCLUDED in total spending, sign-normalized to a positive expense
(+7.489), and relocated under Obligations. The theme table below is the pre-
alignment record; the current authoritative parity numbers live in
`docs/specs/federal-parity-report-2024.md`.

| Theme                          | Current site | Generated |      Δ | Reason                                                                                                                                                                                                                                                                       |
| ------------------------------ | -----------: | --------: | -----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Economy and Standard of Living |       120.10 |    118.44 |  −1.66 | basis (Vol II cash vs Vol I accrual for the ESDC/ELCC carve-outs; small curation drift)                                                                                                                                                                                      |
| Social Security                |       120.24 |    120.25 |  +0.01 | rounding                                                                                                                                                                                                                                                                     |
| Safety                         |        22.69 |     25.40 |  +2.71 | basis (RCMP +2.16 and Justice +0.53 are gross Vol II expenditures; site used net program cost). Site's five IRCC program leaves sum to 6.34 vs our ministry-level 6.35 ✓                                                                                                     |
| Other                          |         6.86 |     10.02 |  +3.16 | basis (PSPC +1.59, SSC +0.99, TBS +0.37 gross vs net) + mapping (audit-agents/OAG +0.14 is a deliberate addition)                                                                                                                                                            |
| Transfers to Provinces         |       100.30 |     93.85 |  −6.45 | mapping (Vol I "Other major transfers" line ≈6.98 — gas tax/home-care transfers — stays in its administrative ministries (HICC/Health) to avoid double-count; site's Equalization excludes fiscal stabilization ±0.6 which our dataset column includes, offsetting in QTO)   |
| Obligations                    |        47.27 |     47.27 |   0.00 | exact (Vol I public debt charges)                                                                                                                                                                                                                                            |
| Defence                        |        34.48 |     34.85 |  +0.37 | basis (gross vs net)                                                                                                                                                                                                                                                         |
| Indigenous Priorities          |        42.84 |     62.96 | +20.12 | source-correction: the site's curated leaves omit the FY2024 $20.00B "Compensation for First Nations children…" ISC payment (and net out parts of the CIRNAC out-of-court settlements). 62.96 − 20.00 = 42.96 ≈ site's 42.84. Generated data is faithful to Public Accounts. |
| International Affairs          |        19.20 |     19.26 |  +0.06 | rounding                                                                                                                                                                                                                                                                     |

Cross-year sanity: FY2019 themes all plausible (Obligations 23.3 = published
debt charges; revenue 332.2 exact); Other Major Transfers residual positive in
all 12 years (peak 21.3 in COVID FY2021); carbon rebate ramps 0 → 0.66 (2019)
→ 15.6 (2025) after adding the 2023-edition label alias ("Proceeds from the
pollution pricing framework returned").

Known quirks handled in code (`export/major_transfers.rb`, `vol1_statement.rb`):
Table 3.7 rows appear in two editions per year (own edition preferred);
statement labels drift in case/wording across editions (matching is
case/whitespace-insensitive with alias lists); only Statement-of-Operations
rows are read (the CSVs carry seven statements).

Province-level children under health-transfer / social-transfer / equalization
now ship (site parity at node level; the site's per-province split used
different vintages and does not match Table 3.7 exactly — ours follows the
published table, reason-coded source-correction).

## Post-first-pass follow-ups (2026-07-06)

- **Empty vote labels (exporter):** ~100 of ~300 vote rows per year (24/24 in 2016,
  nearly all in 2016–2018) have empty `vote`/`description` in `departments/*.json`
  — likely statutory/aggregated rows the `votes()` aggregation leaves unlabeled.
  They render as blank description cells in LineItemTable (EN and FR alike) and are
  skipped by the i18n collector. Fix in the exporter (e.g. label from vote number or
  "Statutory amounts") — then `pb translate` picks them up incrementally.
- **Governor General portfolio:** Shared Services Canada is ~99% of the
  `governor-general` ministry total in several years (Public Accounts portfolio
  grouping artifact). Review the slug/portfolio assignment in ministry_slugs.yaml.
- **HICC 2023 entities:** Office of the Chief Electoral Officer + Commissioner of
  Official Languages appear under housing-infrastructure-communities — verify the
  portfolio grouping for that year.

## Standard-object miniSankey reconciliation (2026-07-06)

The department miniSankey is the **standard-object** breakdown (department →
organization → the twelve GC standard objects, with negative external/internal
revenue leaves), sourced from the `dmac-meso` open dataset (one edition per PA
year 2014–2025). Vote/allotment data continues to feed `votes[]` and the
line-item table unchanged.

**Reconciliation basis.** Vol II allotment `expenditures` equal the
standard-object **GROSS** total (Σ of the twelve objects) for the same
ministerial scope — verified exact for e.g. National Defence, Justice and
Treasury Board (allotment − gross ≈ 0.000). So the per-department check
compares standard-object GROSS to allotment expenditures, floor
`max(2%, $50M)`. The revenue leaves are a display device (net presentation);
they are NOT netted for reconciliation. Out-of-tolerance department-years are
written to `export_errors.md` (non-blocking) — all 12 years still ship.

**Systematic out-of-tolerance causes (documented, not data errors):**

- **Net-voted common services** (public-services-and-procurement-canada
  +25–45%; also public-safety, treasury-board): allotment reflects net-voted
  authorities while the standard-object table reports gross object spending, so
  gross > allotment. Structural, every year.
- **Pre-2018 presentation basis:** in editions ≤2017 many departments’
  standard-object gross runs a few % _below_ allotment (CRA, justice,
  public-safety, ESDC, health, DND ~2–15%). Whole-of-year presentation change;
  the ≥2018 editions reconcile cleanly.
- **Portfolio scope (immigration-refugees-and-citizenship, +8–27%):** the meso
  portfolio pools the Immigration and Refugee Board / settlement bodies that the
  allotment side resolves elsewhere.
- **FY2020–21 governor-general (−99%):** an ALLOTMENT-side artifact — code
  `gn-dg` is page-title noise ("Public Accounts of Canada") mapped to
  governor-general, pulling ~$2.7–3.2B (Shared Services Canada) into the
  portfolio total. The standard-object figure (~$25M) is the accurate one. See
  the Governor General note above.
- **2016 innovation/transport lumping:** the org-less 2016–2018 allotment lumps
  agencies at ministry level, so the standard-object org split diverges.

**Orphaned meso spending (excluded, no allotment page that year):** Shared
Services Canada ("Digital Government", FY2020–21, ~$2B) and Infrastructure
(FY2016, ~$3.5B) have no allotment portfolio page those years, so their meso
rows are dropped from the breakdown (they belong to no shipped department).

**RDA reattribution.** Regional development agencies (PacifiCan, FedDev, CanNor,
ACOA, WD, EDC-Quebec) are moved to `regional-economic-development` via the
organization overrides extended to the meso dataset, guarded by year: the
override only wins when that slug has allotment data (2014–2015, 2019+), so in
2016–2018 (no separate RDA page) they stay with the host portfolio, matching
the allotment side.

**Portfolio label crosswalk.** The meso portfolio column carries PA-era wording
that the allotment extraction modernized; matching is space/comma/footnote
insensitive, with a small `meso_portfolio_aliases` list for genuinely renamed
portfolios (e.g. "Foreign Affairs, Trade and Development" → global-affairs).

## Consolidated-statement alignment (2026-07-06)

Spec `docs/specs/consolidated-statement-alignment.md`. The headline, Sankey, and
Vol I statement now agree exactly (±$1M) for every exported year.

- **Total spending now includes net actuarial losses.** `Vol1Statement#total_spending`
  = the "Expenses" lvl1 section + the "Net actuarial losses" lvl1 section,
  sign-normalized so a loss is a POSITIVE expense (the CSV stores it inverted:
  FY2024 −7,489 = a $7.489B loss). FY2024 headline spending is now **521.425**
  (published total expenses), not the retired 513.94 (which excluded net
  actuarial losses). Verified across all three editions (2025 → FY2016+, 2024,
  2023-eng → FY2014–2023): "Expenses"/"Revenues" positive; "Net actuarial
  losses" and "Annual operating deficit" stored negative.
- **Deficit = the published "Annual operating deficit" line**, normalized so
  positive = deficit / negative = surplus, and it identically equals
  `total_spending − total_revenue`. Enforced as a hard export validation per
  year (`assert_vol1_consistency`). **No fiscal year 2014–2025 is a surplus** on
  this published operating basis — FY2015 is the smallest deficit (+0.55B). On
  the OLD basis that excluded net actuarial losses FY2015 read as a $7.0B
  surplus; including the $7.6B actuarial loss flips it to a small deficit. The
  overview StatCard still flips to "Surplus" (positive magnitude) whenever
  `deficit < 0`; that branch is simply not triggered by this dataset.
- **`net-actuarial-losses` relocated** from the `other` theme to `obligations`
  (alongside net interest on debt), amount sign-normalized to +7.489 via a new
  `negate: true` rule flag. Obligations FY2024 = 47.273 + 7.489 = **54.762**.
- **`accounting-basis-adjustments` reconciling leaf.** One top-level spending
  leaf = `totalSpending − Σ(spending leaves)` makes the Sankey column equal the
  published headline (emitted only when |residual| ≥ $1M). It equals
  reconciliation.json's unattributed remainder item. Per-year values (FY2024 =
  **−25.854**; not the spec's rough −10.9 estimate, which predated flipping net
  actuarial losses to +7.489 — that flip adds 14.978 to the gross tree). It is
  negative when the Vol II gross tree exceeds the Vol I consolidated net total.
- **No surplus/padding node** exists (or ever existed) in this pipeline's tree;
  the old curated site's "$13.77B Surplus" leaf was the column gap (revenue −
  spending), now the natural visual gap between the two Sankey columns.
