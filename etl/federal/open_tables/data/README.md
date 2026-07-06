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
