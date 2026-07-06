# open_tables/data

This directory is intentionally empty in git.

CSVs downloaded from the Public Accounts open-data tables (via
`bin/pb download-tables`) land here. They are fetched on demand from
`donnees-data.tpsgc-pwgsc.gc.ca` / `open.canada.ca` using the mapping in
`../mapping/table_mapping.csv`, and are not committed to the repository
(the full set is ~84 MB).

Run `bin/pb download-tables` from `etl/federal/` to populate this directory
locally. Re-running is safe: the command checks whether the upstream mapping
file has changed before re-downloading.

## Committed editions (used by `pb export`)

A few editions are committed (un-ignored in `.gitignore`) so `pb export` is
reproducible without a network fetch:

- `cdeif-tycfi-{2023-eng,2024,2025}.csv` — Vol I Ten-Year Comparative Financial
  Information (headline totals, revenue lines, vol1-sourced thematic nodes).
- `dmac-meso-{year}.csv` / `dmac-meso-{year}-{eng,fra}.csv` — "Ministerial
  Expenditures by Standard Object as per the Public Accounts of Canada"
  (open.canada.ca dataset `9c4bcc95-bd73-4476-b86f-03553d489a45`), one edition
  per Public Accounts year 2014–2025. These drive the department miniSankey
  standard-object breakdown. Provenance:
  - ≤2023: `https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/dmac-meso/dmac-meso-{year}-eng.csv`
    and the matching `-fra.csv` (official French object labels).
  - 2024, 2025: `https://donnees-data.tpsgc-pwgsc.gc.ca/ba1/dmac-meso/dmac-meso-{year}.csv`
    (single bilingual-header file).

  Column → standard-object-name mapping (Std-obj1..12) is fixed by the Vol II
  Table 3 header (`.../{year}/vol2/s1/dmac-meso-eng.html`) — the twelve canonical
  GC standard objects, plus `External-revenues` / `Internal-revenues`; units
  are `x1000`. See `lib/pb_cli/export/standard_objects.rb` (OBJECTS / OBJECTS_FR).
