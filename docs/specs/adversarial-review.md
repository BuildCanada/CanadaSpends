# Spec: Adversarial review of the federal public accounts pipeline PR

**Status:** Approved
**Date:** 2026-07-10
**Scope:** the entire `federal-public-accounts-pipeline` branch (PR #275) —
ETL, generated data, site, i18n, prose, docs — reviewed as a hostile
auditor, not a proofreader.

## Posture

Assume every claim in the PR description, the specs, the methodology page,
and the parity report is wrong until independently re-derived. The pipeline
was built and verified by agents; this review must not reuse their
verification paths. Where the exporter validates X, ask what passes
validation while still being wrong. The reviewer's product is falsification
attempts with evidence, not a summary of what exists.

## Dimensions (each gets dedicated attack time)

1. **Numerical fidelity to source.** Re-derive, WITHOUT using the pipeline
   code: FY2024 and one vintage year's (2016) headline totals from the raw
   cdeif CSVs; two departments' standard-object figures from the raw meso
   CSVs; one theme's Sankey value from first principles. Compare against
   the shipped JSON and the rendered pages. Any mismatch is a finding.
   Verify at least three figures against the published Public Accounts on
   canada.ca itself (not our copies).
2. **Validation blind spots.** The export validations check sums and
   identities. Enumerate what they cannot catch: pro-rata misallocation
   (sum-preserving), swapped labels, wrong-year joins, sign conventions
   that cancel, offset mechanics that keep totals but corrupt categories.
   For each blind spot, actively test whether the corruption exists.
3. **Allocation honesty.** The accrual re-basing prorates by Vol II shares
   and scales vintage editions. Spot-audit: pick a ministry×theme cell and
   recompute the allocation by hand; check the scale factors against the
   raw editions; check an N:M split (RDA) and an org override (SSC, 2020).
4. **Site behavior.** Attack: prose section-token splitter (tokens inside
   HTML comments, malformed frontmatter, duplicate/unknown tokens);
   `dangerouslySetInnerHTML` in renderProse — can committed prose inject
   markup/scripts (markdown link with `javascript:` href, raw HTML in
   prose)?; inflation scaling on negative values and CSV export;
   `generateStaticParams` vs actual files (a slug in departmentsByYear with
   no JSON, or vice versa); year param edge cases; legacy redirects; 404s;
   hreflang; localStorage mode with disabled storage.
5. **i18n integrity.** fr.json/fr.hashes consistency (hash of current EN
   text vs stored), duplicate ids across files, French pages leaking
   English (data labels AND Lingui strings), encoding artifacts (NBSP,
   dashes), the corrected-104-entries claim.
6. **Editorial honesty.** Methodology page claims vs implementation (line
   by line); parity-report reason codes — sample five rows and verify the
   stated reason actually explains the delta; the workforce EE-scope
   caveat; the "sums exactly" claims (re-add figures on rendered pages).
7. **Prose factual audit.** Sample 10 generated prose files across years:
   every specific claim vs that year's JSON; placeholder rendering; FR/EN
   semantic agreement.
8. **Regressions.** Budget page, provincial/municipal pages, homepage,
   sitemap/SEO surface, build output (pnpm build must pass and page count
   must be sane), pre-existing routes.

## Rules

- Review only — fix NOTHING. (Findings may propose fixes.)
- Every finding: severity (critical/major/minor), CONFIRMED (with the
  reproduction command and observed vs expected output) or PLAUSIBLE
  (with what would confirm it), and file:line anchors.
- Falsification attempts that FAILED are also reported (one line each) —
  they are the evidence behind any "verified" statement.
- Sources of truth, in order: published Public Accounts (canada.ca) >
  official CSVs > shipped JSON > rendered pages. A disagreement anywhere in
  the chain is a finding against the downstream artifact.
- Budget: thoroughness over speed; but timebox dimension 7 (prose) to a
  sample, not an exhaustive read.

## Deliverable

`docs/specs/adversarial-review-findings.md`: findings ranked most-severe
first, then the failed-falsification log, then a short "residual risk"
section (what this review could not check and why). The agent's final
message summarizes the top findings.
