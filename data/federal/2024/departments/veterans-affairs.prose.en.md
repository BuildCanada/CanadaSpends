---
reviewed: true
source: hand-written (edited 2026-07-06)
---

Veterans Affairs Canada (VAC) is the federal department responsible for supporting Canadian veterans, still-serving members of the Canadian Armed Forces, and their families. It delivers financial benefits, health care and rehabilitation services, and recognition programs, and it leads the national remembrance initiatives that preserve Canada's military history.

{{section:stats}}

VAC spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $521.4 billion in overall federal spending, ranking thirteenth among federal departments in total spending.

{{section:entities}}

Federal spending shifts over time with population growth, changes in policy and programs, and emerging priorities. Over the long run, VAC spending has grown more slowly than overall federal spending, leaving the department's share of the federal budget close to where it stood decades ago. Acute events can also move spending sharply from year to year: during the COVID-19 pandemic, the Government of Canada's total expenses rose from $346.2 billion in 2019 to $373.5 billion in 2020 and $644.2 billion in 2021, while VAC's expenditures grew only modestly over the same period once adjusted for inflation.

{{section:miniSankey}}

Federal departments often span several entities. In FY 2024, VAC's {{totalSpending}} was divided between two: the Department of Veterans Affairs, which accounts for nearly all of the total, and the much smaller Veterans Review and Appeal Board. That spending supports benefits and services for veterans and their families and funds national commemoration programs.

<!--
Figure decisions (FY2024 basis = Volume II; department JSON: totalSpending 6.07119, percentageOfFederal 1.1813, entities Dept. of Veterans Affairs 6.053066 + Veterans Review and Appeal Board 0.018124):
- $513.9B overall federal: retained (from original page; matches summary.json 513.936).
- Since-1995 growth 77%/51% and pandemic totals ($410.2B/$420B/$720.3B): retained from original hand-written page (historical, not FY2024 figures).
- Dropped original "1.1%" FY2024 share literal: contradicts JSON (1.18% rounds to {{percentageOfFederal}} = 1.2%); folded qualitatively.
- Dropped original inflation-adjusted trend endpoints "$5.5B (2019) / $6.3B (2024)": not in JSON, and $6.3B would read against the nominal {{totalSpending}} ($6.07B) shown on the page's charts; rephrased qualitatively.
- Dropped orphaned chart heading "10 departments accounted for 73.2%" and the ministerial appointment/Oath/Rideau Hall boilerplate.
Section tokens (spec Part A) added, EN/FR identical, reproducing the original production component order: stats, entities, miniSankey. Unreferenced sections auto-append in default order: historicalShare, lineItems.
Figure sync (adversarial-review M1/M2/M3, 2026-07-10): dropped unverifiable since-1995 growth (77%/51%), reworded qualitatively (m15); total federal spending $513.9B->$521.4B (summary.json totalSpending 521.425); COVID-era totals $410.2/$420/$720.3B -> $346.2/$373.5/$644.2B (2019/2020/2021 summary totals, accrual basis).
-->
