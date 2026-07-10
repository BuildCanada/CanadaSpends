# Adversarial review findings — federal public accounts pipeline (PR #275)

**Reviewer posture:** hostile auditor. Every claim independently re-derived
without reusing `etl/federal/lib`. Throwaway re-derivation scripts written in
Python against the raw committed CSVs (`etl/federal/open_tables/data/`,
`etl/federal/extracted/data/`); site behavior traced in source; three figures
cross-checked against the published Public Accounts on canada.ca.

**Counts:** 8 CONFIRMED findings, 2 PLAUSIBLE, 24 failed falsification attempts.

**Severity tally:** MAJOR 5, MINOR 10 (of which 2 PLAUSIBLE).

The **numbers are sound.** Every headline, ministry, theme, standard-object, and
accrual figure I re-derived ties to source to the dollar (see failed-falsification
log). The findings cluster on **prose that was reviewed against a stale data
vintage**, an **unsanitized HTML sink**, a **cross-page basis seam that is
documented but not quantified**, and small **i18n / SEO / editorial** defects.

---

## MAJOR

### M1 — Reviewed FY2024 prose asserts total federal spending = $513.9B, contradicting the shipped $521.4B (the PR's central number). CONFIRMED

The 14 hand-edited FY2024 department prose pages were reviewed against a
**pre-accrual-rebasing data vintage** and never re-reviewed after the JSON was
regenerated. Their embedded literals and narrative are now stale, even though the
`{{totalSpending}}`/`{{percentageOfFederal}}` placeholders auto-update.

- 26 files (13 departments × EN/FR) state the department spent
  `{{percentageOfFederal}}` "of the **$513.9 billion** in total federal spending"
  — e.g. `data/federal/2024/departments/national-defence.prose.en.md:10`,
  `canada-revenue-agency.prose.en.md`. Shipped `data/federal/2024/summary.json`
  `totalSpending` = **521.425**, and canada.ca confirms $521.4B (see X-canada).
  FR mirrors carry "513,9 milliards".
- The prose audit comments prove the vintage drift: they cite JSON values that no
  longer match the shipped JSON.
  - `public-services-and-procurement-canada.prose.en.md` comment: `totalSpending
10.676222` — shipped JSON is **8.285182** (−22%).
  - `national-defence.prose.en.md:25` comment: `"$513.9 billion" total federal
retained (matches summary.json 513.936)` — summary.json is now **521.425**.
  - `national-defence` comment `totalSpending 34.848181` vs shipped **34.493669**;
    also `indigenous-services` (63.028584 vs 62.937056), `innovation` (10.010487
    vs 9.756435), `transport` (5.1961 vs 5.097866).
- **Repro:** `grep -rl "513.9\|513,9" data/federal/*/departments/*.prose.*.md`
  (26 files) then compare `data/federal/2024/summary.json` `totalSpending`.
- **Observed vs expected:** department pages tell users total federal spending is
  $513.9B while the overview page (and canada.ca) says $521.4B — the exact $7.5B
  net-actuarial gap this PR was built to close.
- **Fix:** re-run/re-review FY2024 prose against the current JSON; the $513.9B
  literal should be a `{{...}}` placeholder off `summary.json`, not a literal.

### M2 — Wrong COVID-era totals hardcoded in reviewed prose (off by $46B–$76B). CONFIRMED

A boilerplate paragraph in several FY2024 reviewed departments claims total
federal expenses "rose from **$410.2 billion** in 2019 to **$420 billion** in
2020 and **$720.3 billion** in 2021." Shipped `summary.json` for those years:
**346.182 / 373.523 / 644.175**. Every figure is wrong on the current basis
(Δ +64B / +46.5B / +76B).

- **Repro:** `grep -rl "720.3" data/federal/*/departments/*.prose.*.md` → 11 files
  (PSPC, Transport, Veterans, Innovation, Finance, IRCC, Housing… ×EN/FR); compare
  `data/federal/{2019,2020,2021}/summary.json`.
- **Fix:** these are literal figures in reviewed prose that violate the spec §9
  "no literal figures" intent (see m9); drop or placeholder them.

### M3 — CRA reviewed prose claims "55.2% of net spending went to salaries" — JSON says 35.1%. CONFIRMED

`data/federal/2024/departments/canada-revenue-agency.prose.en.md:18`: "In FY 2024,
**55.2%** of the agency's net spending went to salaries, benefits, and pensions."
The department JSON miniSankey Personnel leaf = **5.895203** of `totalSpending`
**16.80193** = **35.1%**. No basis in the JSON yields 55.2%; the file's own
comment admits it "Retained as hand-written operational context … not verifiable
in the Vol II JSON" (also lists unverifiable `$379B tax revenues`, `82%`, `$46B
benefits`, `$11.5B recovered`).

- **Repro:** `grep -n "55.2" data/federal/2024/departments/canada-revenue-agency.prose.en.md`;
  `python3` sum of miniSankey Personnel ÷ totalSpending.
- **Fix:** remove the unverifiable 55.2% (and the other hand-carried figures).

### M4 — Prose `renderProseFragment` writes LLM-generated content into `dangerouslySetInnerHTML` with no HTML escaping and no href scheme allowlist. CONFIRMED (code-level; no live payload committed)

`src/app/[lang]/(main)/federal/spending/[year]/[department]/page.tsx:97-106`. The
paragraph is interpolated, then only two regex transforms run
(`**x**`→`<strong>`, `[t](u)`→`<a href="$2" …>`), and the result is assigned to
`__html`. The text is never HTML-escaped, so:

- Raw HTML in a prose `.md` file passes through as active markup — a
  `<img src=x onerror=…>` would execute (innerHTML runs event handlers).
- The link href has no scheme validation — `[click](javascript:alert(1))` renders
  a live `javascript:` anchor.
  The sink is demonstrably exercised: committed reviewed prose contains real
  markdown links (e.g. `employment-and-social-development-canada.prose.en.md`
  → a canada.ca link). Source is **LLM-generated civic copy**; a model emitting a
  `javascript:` link or raw HTML tag would ship live and could survive human review.
- **Repro:** read page.tsx:80-111 — no `DOMPurify`, no escape, no scheme allowlist.
- **Fix:** HTML-escape the paragraph before the two transforms; allowlist
  `http(s):`/`mailto:` on the link href.

### M5 — Overview (accrual) and department-page (standard-object) totals disagree by up to 11× for the same department-year; the seam is documented generically but the magnitude is never disclosed. CONFIRMED (numbers) / PLAUSIBLE (misleading-ness)

Both bases are individually faithful to source, but a user clicking from the
overview into a department page sees a very different number for the same body:

| Dept (FY2024)         | Overview (accrual, `summary.json`) | Dept page (net std-object) | ratio |
| --------------------- | ---------------------------------: | -------------------------: | ----: |
| veterans-affairs      |                         **0.532B** |                 **6.071B** | 0.09× |
| canada-revenue-agency |                        **59.914B** |                **16.802B** |  3.6× |
| national-defence      |                            33.063B |                    34.494B |  1.0× |

- Veterans Affairs is presented on the overview as a **$0.5B** department (one of
  the smallest) while its own page shows **$6.1B** — because veterans' future
  benefits are recognised as accrual liability movements, not current expense, in
  the Vol I segment table. CRA shows the opposite ($59.9B on the overview because
  the Canada Carbon Rebate / benefit distributions are booked as CRA accrual
  expense, vs $16.8B net operating on its page).
- **Both derived from source correctly** (re-derived: VAC cest = 532M, CRA cest =
  59,914M, ND cest = 33,063M — all match `summary.json`; VAC/CRA/ND/PSPC dept
  totals re-derived from raw meso match to 6 dp). The methodology page explains
  the Vol I↔Vol II seam in general terms but never states that for specific
  departments the two site figures differ by 3–11×, nor flags VAC's ~11×
  understatement on the overview.
- **Repro:** `cest-eest-2024.csv` portfolio sums vs `summary.json`; dept JSON
  `totalSpending`.
- **Fix (editorial):** on department pages where |accrual − standard-object| is
  large, surface both numbers with a one-line "why these differ" and, for VAC in
  particular, avoid ranking it as a tiny department on the overview without a note.

---

## MINOR

### m6 — `reconciliation.json` (all 12 years) claims a Sankey leaf that does not exist; the PR description repeats the false claim. CONFIRMED

`data/federal/2024/reconciliation.json:48` note: the −25.85B remainder "Equals the
spending Sankey's \"Accounting and consolidation adjustments\" leaf." **No such
leaf exists** in `sankey.json` or `sankey.full.json` for any year (both 92 leaves,
sum exactly 521.425, no adjustment leaf). The PR description likewise states "a
single 'Accounting and consolidation adjustments' leaf ties the Vol II-based
thematic tree to the Vol I headline (−$25.9B in FY2024)". The methodology **page**
(`methodology/page.tsx:176-184`) is, by contrast, **correct**: it says "no
adjustments leaf appears … the mechanism remains as a safeguard." So the shipped,
renderable `reconciliation.json` note contradicts both reality and the page.

- **Repro:** `grep -rl "Accounting and consolidation" data/federal/2024/` → only
  `reconciliation.json`; leaf-walk of both sankey files finds no such leaf.
- **Fix:** update the reconciliation note to match the page (dormant safeguard,
  not a present leaf).

### m7 — `governor-general` i18n id collision renders the wrong French label in all 12 years. CONFIRMED

The stable id `governor-general` is shared by three sources with different EN text
(the Sankey node "Office of the Secretary to the Governor General", the department
display name "Governor General", and its mini-Sankey root). The collector keeps
the first text seen (`etl/federal/lib/pb_cli/i18n/collector.rb`, `items[id] ||=`),
which is the Sankey node, so `fr.json["governor-general"]` = **"Bureau du
secrétaire du gouverneur général"**. The loader keys the department title,
ministry-list entry, and mini-Sankey root off that same id
(`src/lib/federal.ts:403,344,313`), so in French the "Governor General" department
renders as "Bureau du secrétaire du gouverneur général" instead of "Gouverneur
général." Only cross-source id collision found in any year.

- **Repro:** `data/federal/*/i18n/fr.json` key `governor-general` vs
  `departments/governor-general.json` name.
- **Fix:** namespace ids by source (dept vs sankey-node), or make the collector
  reject/scope duplicate ids rather than silently keeping the first.

### m8 — Prose review gate is opt-out, not opt-in. CONFIRMED (latent)

`src/lib/federal.ts:489`: `const reviewed = parsed.data?.reviewed !== false;`. Spec
§9 and the PR say prose is "gated on `reviewed: true`." As written, a prose file
with **no** `reviewed` key, or with non-throwing malformed frontmatter, renders as
**reviewed**. Currently safe (every file has an explicit key: 2014–2023 all
`false`, 2024 all `true`, 2025 = 27 true / 3 false), but the gate is inverted from
the stated contract. **Fix:** `=== true`.

### m9 — The §9 "no literal `$` figures" lint only guards generated LLM prose, not the hand-written reviewed pages. CONFIRMED

The 14 hand-written FY2024 pages carry dozens of literal `$`/`%` figures in visible
text ($513.9B, $410.2B, $720.3B, $379B, 82%, $11.5B, 55.2% — see M1/M2/M3) that are
unverifiable from the department JSON. The 255 unreviewed LLM files contain **0**
literal-`$` figures (lint works there). The guardrail has a hole precisely where
prose is marked reviewed and shipped. **Fix:** run the literal-`$` lint over
reviewed hand-written prose too.

### m10 — "Complete UI catalog (539/539)" is off by 3. CONFIRMED

`src/locales/{en,fr}.po` each contain **536** msgids (all translated; the only
empty `msgstr` is the PO header). Coverage completeness holds; the stated 539 does
not match the catalog. **Repro:** entry-count of `fr.po`.

### m11 — 244 source labels carry an un-normalized non-breaking space. CONFIRMED (cosmetic)

Transfer-payment descriptions retain a leading `\xa0` from HTML extraction (e.g.
`governor-general-2018-tp-0000`). Ruby `String#strip` removes ASCII whitespace
only, so it is never stripped; EN retains it, FR almost never does (1/244), so
EN/FR diverge by whitespace. HTML collapses it visually. **Fix:** normalize
`\xa0`/unicode whitespace in the extractor.

### m12 — hreflang alternates on every federal page point to the section root, not the localized equivalent page. PLAUSIBLE (SEO)

`src/app/[lang]/(main)/federal/spending/layout.tsx:18` calls
`generateHreflangAlternates(lang)` with no path/params; `src/lib/utils.ts:54`
derives the path from the layout's `import.meta.url` and strips dynamic segments,
yielding `/federal/spending`. `[year]` and `[year]/[department]` define no
`generateMetadata`, so all ~14k pages advertise the same alternate
(`/{lang}/federal/spending`) instead of the fr/en twin of the specific page.
**Confirm:** inspect `<head>` of a built department page. **Fix:** per-page
`generateMetadata` with the real path.

### m13 — Identical `<title>`/description across all federal year and department pages. CONFIRMED (SEO)

Only `layout.tsx:16-17` and `methodology/page.tsx` set metadata; neither `[year]`
nor `[year]/[department]` has `generateMetadata`. Every one of ~14k pages shares
"Federal Government Spending | Canada Spends" and the same description, with no
per-page canonical. **Fix:** per-page title/description/canonical.

### m14 — "RDAs grouped under one portfolio across years" is overclaimed; the page is absent 2014–2019 and cross-year totals are not comparable. CONFIRMED

`regional-economic-development.json` exists only from ~2020 on (present 2020/2024/
2025, **absent 2016**). In the raw 2016 meso the RDAs (ACOA, CanNor, CED-Q,
FedDev-ON, WD) sit inside the "Innovation, Science and Economic Development"
portfolio, so their spend is folded into `innovation-science-and-industry` in early
years and split out later. Faithful to source, but the "across years" claim is
partial and the ISED series is not year-over-year comparable across the split.

- **Repro:** `ls data/federal/2016/departments/` (no RDA slug); raw
  `dmac-meso-2016-eng.csv` portfolio field for the five agencies.
- **Fix:** note the machinery change on the RDA and ISED pages / methodology.

### m15 — "Since 1995" growth claims in reviewed prose are unverifiable from shipped data. PLAUSIBLE

E.g. `veterans-affairs.prose.en.md`: "Since 1995, overall federal spending has
risen about 77% while VAC spending has grown roughly 51%." Department JSON
`historicalShare` starts 2014 and `historical_pre2013.json` carries no per-year VAC
totals, so these specific percentages cannot be derived from shipped data and were
hand-introduced. **Confirm:** attempt to reconstruct from
`historical_pre2013.json` (insufficient). **Fix:** drop or source them.

---

## Failed falsification log (evidence behind every "verified" statement)

Numerical fidelity (re-derived from raw CSVs, not the pipeline):

- **X-canada — FY2024 headline confirmed on canada.ca itself.** The published
  Annual Financial Report / Public Accounts 2024 states total expenses **$521.4B**,
  annual operating deficit **$61.9B**, deficit before net actuarial losses
  **$54.4B**, net actuarial losses ~**$7.5B** — all match shipped `summary.json`
  (521.425 / 61.876 / 513.936-basis / 7.489). (canada.ca dept-finance annual
  financial report 2023-24.)
- FY2024 headline re-derived from `cdeif-tycfi-2024.csv`: revenue 459,549M,
  expenses excl. net actuarial 513,936M, +7,489M NAL = 521,425M, deficit −61,876M.
  Matches shipped 521.425 / 459.549 / 61.876 to the dollar.
- FY2016 (vintage) re-derived from same file (2015/2016 column): 295,469 /
  292,608 / −2,861 → matches shipped 295.469 / 292.608 / 2.861.
- Ministry list sums exactly to `totalSpending` in **all 12 years** (diff ≤ 5e-4).
- Spending Sankey leaf-sum = 521.425 exactly (2024); **leaf-only amounts** — no
  parent node carries an amount (the D3 double-count bug is genuinely fixed);
  `sankey.full.json` identical structure (92 leaves) + Nunavut.
- Social Security theme = 120.247B re-derived from first principles (OAS 76.036 +
  Children 26.339 + EI 23.130 − COVID 4.838 − CEWS 0.420) — matches node and cdeif.
- CHT provincial breakdown sums to the published CHT line **49.431B** to the dollar.
- PSPC net standard-object = **8.285182B** re-derived from `dmac-meso-2024.csv`
  (net = Σstd-obj − external − internal rev); all four entity values match to 6 dp.
- National Defence net standard-object = **34.493669B** from raw meso — matches
  dept page.
- ND / CRA / VAC accrual (33.063 / 59.914 / 0.532B) re-derived from
  `cest-eest-2024.csv` portfolio sums — match `summary.json` exactly.
- `reconciliation.json` items sum to the stated `difference` (35.704328) for 2024.
- SSC-2020 override works: Governor General shows its true **$0.0232B** (raw meso
  confirms 23.2M), SSC ($1.9736B) routed into PSPC; same pattern 2021.

Validation blind spots actively tested (no corruption found):

- No sum-preserving pro-rata corruption detected in the theme cells I recomputed;
  no swapped province labels in the CHT/equalization/social-transfer breakdowns
  (all tie to published lines); sign conventions on the four negative leaves
  (COVID −4.838, CEWS −0.42, Quebec Tax Offset −7.68, Provision −1.736) are
  consistent and preserved through inflation scaling and CSV export.

Site behavior:

- `generateStaticParams` ↔ on-disk files ↔ `summary.json` slugs fully consistent
  all 12 years (no orphan slug or file).
- Year param `/1999`, `/2099`, `/abcd` all 404 (regex `^20\d\d$` + membership +
  `dynamicParams:false`).
- localStorage disabled/private-mode: every access try/catch-wrapped
  (`InflationContext.tsx:51-70`) — no crash, stays nominal.
- Inflation scaling uniform `value*scale`, negatives preserved, CSV export reuses
  the same scaled columns (table and CSV agree).
- Section-token splitter robust to tokens-in-comments, malformed frontmatter,
  duplicate/unknown tokens (section still appended via default order; no content
  loss; no crash).
- Legacy redirects: all 14 department slugs redirected (`next.config.ts:134-156`);
  no `/federal/federal/` regression (already fixed on merge-base).
- Prose placeholder resolution: reviewed prose references only `name`,
  `totalSpending`, `percentageOfFederal` — all provided; no blank-hole renders; no
  misspelled JSON-path placeholders anywhere.
- Prose gating in practice: 255 unreviewed files render stats-only via
  `getFederalDepartmentProse` + `prose.reviewed` guard.

i18n:

- **0 stale hashes** — every `fr.hashes.json` matches SHA256(current EN) with
  Ruby-strip semantics (an initial 16 "stale" were a Python `.strip()`/`\xa0`
  false positive).
- **0 missing labels** — every id emitted from `sankey.json`/`departments`/
  `reconciliation.json` has an `fr.json` entry, all years (100% coverage holds).
- **0 genuine English leaks** — ~200/year `fr==en` values are cognates/proper
  nouns; no multiword EN phrase left untranslated. **0 orphan fr ids.**

Editorial / build:

- Workforce **salary-band EE-scope caveat is present and accurate**
  (`FederalWorkforceStrip.tsx:147`: "covers the employment-equity population, a
  subset of the federal public service"); age bands sum exactly to the headline
  headcount (367,772); salary bands legitimately cover a 266,433 subset — disclosed.
- Parity report reason codes spot-checked (VAC −5.57 "basis", CRA +43.11 "basis",
  ND −1.44 "basis"): every delta is a real, re-derivable Vol I-accrual vs
  Vol II-net difference — no `unexplained` row is actually unexplained.
- `bundle exec rake` in `etl/federal`: 255 runs, 0 failures.
- `pnpm build`: compiled successfully, **13,714** static pages, only lint warnings
  (unescaped-entity, `<img>`), no errors. (Build regenerated `data/static-data.json`
  as a side effect; reverted — no working-tree change left by this review.)

---

## Residual risk (what this review could not fully check, and why)

- **Prose factual audit was a sample (~10 files + systematic literal/placeholder
  scans across all 612 files), not an exhaustive read** (spec timeboxes it). The
  255 unreviewed 2014–2023 prose files render stats-only, so their body text does
  not reach users, but was not deep-read.
- **XSS (M4) was traced statically, not executed** — the rules forbid editing
  committed prose, so no live `javascript:`/`onerror` payload was planted. The sink
  and the absence of sanitization are code-confirmed; the exploit is PLAUSIBLE-strong.
- **canada.ca cross-check used the published Annual Financial Report summary
  figures.** Deep line-level canada.ca HTML tables were not fetched (the direct
  finance page returned HTTP 403); the official open.canada.ca CSVs committed in
  the repo were treated as the authoritative source below the headline.
- **Sub-ministry thematic allocation** (pro-rata of a portfolio's accrual total
  into theme sub-nodes) was spot-checked at the theme and ministry level, not
  recomputed for every N:M split; a sum-preserving misallocation _within_ a theme
  that still totals correctly would not have been caught for themes I did not
  decompose.
- **Vintage years 2014–2023** were verified structurally and at the headline
  (all 12 years sum-tie), plus FY2016 fully re-derived; not every one of the 306
  department-years' standard-object figures was independently recomputed.
- **French prose semantic agreement** was sampled, not fully audited; FR mirrors of
  the stale-figure findings (M1/M2) were confirmed to carry the same stale numbers.
- **hreflang (m12)** is marked PLAUSIBLE — confirmed in code, not verified in the
  built `<head>` output.
