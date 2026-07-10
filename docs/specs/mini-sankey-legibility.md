# Spec: Department miniSankey legibility

**Status:** Approved
**Date:** 2026-07-06
**Parent spec:** federal-public-accounts-pipeline.md (§7 departments/{slug}.json)

## Problem

Department miniSankey leaves are labeled "Vote 1", "Vote 5", "Vote 10",
"Statutory amounts" — appropriation identifiers that mean nothing to readers.
The source data carries real descriptions the exporter currently discards:
`mini_sankey` in `etl/federal/lib/pb_cli/commands/export.rb` calls
`split_vote` and keeps only the vote label, dropping the description
("Operating expenditures", "Capital expenditures", "Grants and
contributions", …). Below votes, the allotment rows carry a further level of
detail ("Operating budget", "Heyder and Beattie Class Actions", "Service
Income Security Insurance Plan") that is sometimes genuinely informative.

## Target tree

`department → organization → vote (named by its DESCRIPTION) → allotments
(only when informative)`

1. **Vote nodes are named by description, not number.**
   - "Vote 1—Operating expenditures" → node name `Operating expenditures`.
   - Statutory rows keep `Statutory amounts`.
   - Votes with empty text (2016–2018 editions) keep the existing
     "Total appropriations…" fallback labeling from `split_vote`.
   - The vote number is not lost: keep it in the node `id` (unchanged id
     scheme) and add a `vote` field on the node (e.g. `"vote": "Vote 1"`) so
     the UI could surface it secondarily (tooltip); no UI change required
     this phase.
   - Name collisions between sibling votes of the SAME organization with the
     same description (rare; e.g. two "Program expenditures" votes) must be
     disambiguated by appending the vote label: `Program expenditures
(Vote 15)`.

2. **Allotment children appear only when they add information.** For each
   vote node, look at its allotment rows:
   - If there is exactly one allotment, or all allotments are administrative
     shells (single row named like the vote, or generic labels — at minimum
     treat `Operating budget`, `Capital budget`, `Grants and contributions`,
     `Statutory amounts`, `Reprofile`, `Total` as generic), emit the vote as
     a LEAF (no children).
   - Otherwise emit the allotments as children (top-N + "Other" via the
     existing Truncation, N = existing MINI_SANKEY_TOP_N), so items like
     class-action settlements become visible. A generic "Operating budget"
     row stays as a child in this case (it's the residual), keeping sums
     exact.
   - Amounts remain on leaves only (parents carry no amount — hard contract,
     see the Sankey double-counting fix; `strip_parent_amounts` already
     enforces this at serialization, keep it that way).

3. **Sums stay exact.** Parent=children within $1M validation must keep
   passing; the exporter's tree balance assertions and determinism
   requirements are unchanged.

## Translation (French)

- Vote-description node names duplicate the EN text of `votes[].description`,
  which is already fully translated — the i18n driver dedupes by exact EN
  text, so these resolve from the existing corpus at merge time.
- Allotment descriptions are NEW strings. After regenerating, run the
  scratchpad driver + merge pipeline (`translate_driver.rb`,
  `merge_translations.rb`, union chunks `completed_chunk_{1..4}.json`).
  Glossary + union will cover part; for the residual: if ≤ ~300 unique
  strings, translate them (Canadian-government register, glossary-anchored)
  into a new `completed_chunk_5.json` (extend the merge script's chunk range)
  and finish at 100%; if materially larger, ship with English fallback for
  the tail, and report the count — fr.json's per-id English fallback is the
  designed degradation.

## Acceptance

1. National Defence FY2024 miniSankey shows `Operating expenditures /
Capital expenditures / Grants and contributions / Statutory amounts / …`
   instead of `Vote 1 / 5 / 10`, with the class-action allotments visible
   under Operating expenditures.
2. All 12 years re-export deterministically; `bundle exec rake` green
   (update tests that pin the old "Vote N" node names; add coverage for the
   description naming, the disambiguation rule, and the informative-allotment
   rule).
3. `data/federal` regenerated; French label coverage restored per above.
4. Live check: a department page renders the new labels EN + FR; the
   line-item table below is unchanged.
