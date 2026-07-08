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

## Main-page Vol I accrual basis (2026-07-06)

Spec `docs/specs/main-page-accrual-basis.md`. The overview ministry list and the
thematic Sankey are now on the Vol I consolidated (accrual) basis, sourced from
Vol I **Table 3.6** "External expenses by segment and by type" (`cest-eest-*`,
CKAN dataset `353333bd-3b26-4b05-8088-ca883188b80c`; EN+FR editions 2014–2025
committed, un-ignored). Reader: `PbCli::Export::SegmentExpenses`.

- **Year coverage: ALL 12 years (2014–2025) are on the accrual basis** via
  restatement scaling (follow-up to the original spec, which had 7 fallback
  years). Each year's own-vintage 3.6 edition carries figures as first
  published, while `Vol1Statement` reads the RESTATED ten-year comparative, so
  all portfolio totals (and the provision / Crown-corporations segments) are
  scaled proportionally to tie to the restated statement total exactly:
  `factor = (total_spending − actuarial_stmt) / (3.6 total − actuarial_seg)`.
  Net actuarial losses ALWAYS come from the statement line; the ≤2019 editions
  predate the net-actuarial split (no actuarial segment), so the statement
  amount is carved out of the portfolios by the same proportional scaling.
  **Guard:** the restatement deviation (|factor−1| minus the actuarial
  carve-out share) must be ≤ 1%, else the year is export-blocked with the delta
  reported (`SCALE_GUARD`); the adjustments-leaf machinery is retained as a
  defensive fallback but never fires. Per-year factors (also in the export
  report):
  | Year | Factor | Carve-out | Restatement |
  |---|---|---|---|
  | 2014 | 0.93344 | 7.07% (actuarial 19.661) | 0.42% under carve |
  | 2015 | 0.97303 | 2.70% (7.584) | ~0.01% |
  | 2016 | 0.96277 | 3.41% (10.064) | 0.32% |
  | 2017 | 0.96356 | 3.20% (9.904) | 0.45% |
  | 2018 | 0.96169 | 3.14% (10.352) | 0.70% |
  | 2019 | 0.97585 | 2.42% (8.361) | 0.00% |
  | 2020 | 1.00000 | — | 0.00% |
  | 2021 | 1.00000 | — | 0.00% |
  | 2022 | 1.00021 | — | 0.02% |
  | 2023–2025 | 1.00000 | — | 0.00% |
  Additional pre-2020 mapping wrinkles absorbed: the 2014/2015 editions carry a
  "Canada Revenu Agency" typo (segment alias) and print the provision as a
  portfolio row INSIDE the Ministries segment (rerouted to the segments bucket
  by `SEGMENT_IDS`); the 2014–2016 editions carry a standalone **"Crown
  corporations and other entities"** lump, shown as a third non-link statement
  row and as a leaf under the `other` theme (`crown-corporations-and-other-
entities`, fr «Sociétés d'État et autres entités» from the FR edition); the
  2016 edition has an "Infrastructure and Communities" portfolio while Vol II
  reports Infrastructure inside the `ic` ISED portfolio — merged via the
  reverse direction of `segment_hosts`.
- **Ministry list.** Each row's `totalSpending` is the slug's accrual allocation
  (`basis: vol1_segment_accrual`), `percentage` its share of the published total.
  Non-link statement rows are appended (`basis: vol1_segment`, no slug/href):
  **Net actuarial losses** (always, from the statement line) and **Provision for
  valuation and other items** (plus **Crown corporations and other entities** in
  2014–2016), so the list sums to the headline exactly. FY2024 ISC-slug = **44.749** (Indigenous Services
  23.885 + Crown-Indigenous Relations 20.864) on the overview, while the ISC
  department page still shows the Vol II **63.03**.
- **N:M portfolio → slug allocation** (`compute_accrual_allocations`). Portfolios
  resolving to one slug are summed (merge: ISC+CIRNAC; the RDA agencies in 2024).
  A slug present in Vol II but with no 3.6 portfolio of its own is absorbed into a
  configured host (`segment_hosts`) and the host's 3.6 total is split across
  {host + absorbed} by Vol II expenditure share. Hosts:
  `regional-economic-development → innovation-science-and-industry` (RDAs are
  inside ISED in 2020/2021/2025), `parks-canada → environment-and-climate-change`
  and `women-and-gender-equality → canadian-heritage` (2025). A slug that has its
  own 3.6 portfolio that year stays its own group (so FY2024's clean RDA split is
  used verbatim; FY2023's partial Quebec-only RDA portfolio slightly understates
  the merged RDA slug — documented limitation). Aliases: "Digital Government" →
  PSPC (2020/2021 SSC), accented "…Regions of Québec" → RDA.
- **Thematic Sankey.** Each slug's accrual total is spread across its Vol II
  theme nodes pro-rata. Vol I statement leaves keep their exact statement amount;
  on the accrual basis the tax-system/statutory items that sit inside a
  ministry's 3.6 portfolio total (EI, CCB, carbon rebate, CEWS, COVID) gain an
  `accrual_offset_node` so they are carved out of the owning slug's allocation
  (OAS/EI/ELCC/COVID → ESDC's employment-training; CCB/carbon/CEWS → CRA's
  revenue-canada; CHT/CST/equalization/Quebec/debt → Finance's
  other-major-transfers). All offset nodes verified ≥ 0 in every accrual year.
  The `provision-for-valuation` node (`source: segment`) carries the 3.6 provision
  segment. Tree leaf-sum == headline with **NO** adjustments leaf in accrual years
  (residual = actuarial_seg − actuarial_vol1 = 0). Obligations FY2024 = 47.273
  (debt) + 7.489 (actuarial) − 1.736 (provision) = **53.026**.
- **Kept unchanged:** department pages (Vol II appropriations, `basis:
vol2_appropriations`), `historicalShare` (Vol II ÷ Vol I), and
  reconciliation.json (Vol II-vs-Vol I, keyed on `offset_node`). The site's
  Vol II ministry-list caption branch is retained in code but is dead for
  federal years (every year renders the accrual caption).
  _(Superseded for department pages by the drop-authorities change below.)_

## Drop authorities from department pages; transfer programs (2026-07-08)

Spec `docs/specs/drop-authorities-transfer-programs.md`. Department pages no
longer mix parliamentary authorities (gross of revenue) with the net
standard-object chart. **Every user-facing department figure now comes from the
standard-object (meso) dataset on the NET basis** (Σ objects − external −
internal revenues), so the stat card, the entity list, and the miniSankey are
one number.

- **Department JSON.** `basis` is now `vol2_standard_object_net`. `totalSpending`
  = Σ of the per-organization net values (== the entity-list sum, exactly);
  `percentageOfFederal` = that ÷ the Vol I published total; `entities[]` = each
  organization's net standard-object total; `historicalShare` = the net figure ÷
  the Vol I total for every meso year (2014–2025). `reportedAs` now derives from
  the meso portfolio label(s) the slug resolves from that year (portfolio-
  resolved rows only, never an org-override reattribution). `votes[]` is REMOVED;
  the vote-only `votes`/`split_vote` exporter code and the site's Votes &
  allotments tab / `FederalVoteLine` type are deleted. `transferPayments[]` and
  `historical_pre2013.json` merge behaviour are unchanged.
  - The **card == chart == entities** identity holds for every dept-year
    (bulk-verified: 306 dept-years, worst delta ~1e-14).
- **Transfer-program fanout in the miniSankey.** The "Transfer payments"
  standard-object leaf of the dominant organization fans out into named program
  children from `transfer_payments`. The transfers dataset is ministry-keyed (no
  organization column), so children attach to the organization holding the
  LARGEST transfer object, and only when it holds **≥90%** of the portfolio's
  transfer-object amount; otherwise the object stays unsplit and the skip is
  logged in the export report. Program amounts are scaled pro-rata (scale-to-
  line) so they sum EXACTLY to the object's net amount; zero rows dropped; the
  tail rolls into **"Other transfer programs"** (`Autres programmes de
transfert`). Program leaf ids REUSE the `transferPayments` ids so existing
  French resolves. The fanout is attached AFTER truncation so the generic
  top-N truncation never re-truncates the program children. FY2024 National
  Defence: the ~$1.125B transfer object splits into its contribution programs
  (Military Training & Cooperation, NATO Military Budget / Security Investment,
  etc.) + Other, summing to 1.125459 exactly.
  - **≥90% skips (unsplit, logged):** across 2014–2025 the recurring split
    portfolios are `health-canada` (Dept/PHAC/CIHR/CFIA — top org ~73% in 2024),
    `innovation-science-and-industry`, `parliament`, `public-safety-canada`,
    `environment-and-climate-change`, `regional-economic-development`, and
    `indigenous-services-and-northern-affairs` (2024). PSPC 2014 has a slightly
    negative net transfer object and is skipped (no positive dominant org). See
    the export report's "Transfer-program fanout skips" section for the
    per-year list.

### §3 — internal weights that still read the allotment dataset

Nothing **user-facing** reads the allotment dataset after this change (department
figures are meso; the overview is Vol I accrual). The allotment JSON remains in
the repo and is still consumed **internally**, unchanged, for the OVERVIEW's
accrual machinery only:

1. **Theme-mix spread** (`@slug_node_vol2`, used by `rebase_nodes_to_accrual`):
   each slug's accrual total is spread across its thematic-tree nodes in the
   proportions of its Vol II lines. Node assignment (`Mapping#match_node`) is
   inherently **line-level** (line > organization > ministry-name > ministry
   precedence, with per-program regex line rules) — the meso dataset has no
   line/program detail (only organization × standard object), so this genuinely
   needs the allotment lines. Retained on allotments.
2. **N:M portfolio → slug accrual split weights** (`compute_accrual_allocations`
   denominator): when a host portfolio's 3.6 total is split across {host +
   absorbed slug}, the split is proportional to the members' Vol II expenditure
   shares. Retained on allotments so the **overview stays numerically unchanged**
   (spec acceptance #3 / gate b: "overview unchanged, untouched"); switching this
   weight to meso shares would shift the split-slug accrual totals on the
   overview.
3. **`reconciliation.json`** (`@slug_year_totals`, the Vol II ministry sum vs the
   Vol I total) — overview reconciliation, unchanged.
4. **`validate_meso_reconciliation`** — a non-user-facing QA cross-check of the
   meso GROSS total against the allotment expenditure total (documented
   systematic deltas, non-blocking).

The "bonus real weights for 2016–2018" from meso org/portfolio shares was
deferred to protect overview stability (items 1–2 above would move published
overview figures).
