---
reviewed: true
source: hand-written (edited 2026-07-06)
---

The Department of Transport (Transport Canada) is the federal department responsible for developing and enforcing transportation policies, regulations, and infrastructure projects to ensure the safe and efficient movement of people and goods across Canada. It oversees aviation, rail, marine, and road transportation systems, working to enhance national connectivity and economic growth.

{{section:stats}}

Transport Canada spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $521.4 billion in overall federal spending, placing it among the smaller federal departments by expenditure.

{{section:entities}}

Federal spending shifts over time with population growth, changes in policy and programs, and emerging priorities, and acute events can move it sharply: during the COVID-19 pandemic, the Government of Canada's total expenses rose from $346.2 billion in 2019 to $373.5 billion in 2020 and $644.2 billion in 2021. Transport Canada's own spending has been comparatively steady, holding at roughly 1% of the federal budget over the past decade.

{{section:miniSankey}}

Transport Canada's spending is spread across the core department and several transportation crown corporations and agencies. The Department of Transport itself accounts for roughly $3.0 billion, with the balance flowing to bodies such as the Canadian Air Transport Security Authority (about $1 billion), VIA Rail Canada (about $0.8 billion), and Marine Atlantic. The department is led by the Minister of Transport, a member of cabinet appointed by the Governor General on the advice of the Prime Minister, who oversees transportation policy, safety regulation, infrastructure investment, and related climate initiatives across aviation, rail, marine, and road transportation.

<!--
Figure decisions (FY2024 basis = Volume II; department JSON totalSpending 5.1961, percentageOfFederal 1.011):
- Old page literals "$5.1B" / "1%" replaced with {{totalSpending}} ($5.20B) / {{percentageOfFederal}} (1.0%).
- "$513.9 billion" total federal retained (matches summary.json 513.936).
- Dropped "fourteenth" rank: based on the old $5.1B basis; omitted rather than asserting an unverifiable rank (replaced with "among the smaller federal departments").
- Dropped "74.9%" (federal since 1995) and "0.74% percentage points lower than 1995" (also garbled in the original): not verifiable in JSON. The "relatively flat" claim IS JSON-supported — historicalShare is ~flat around 1% (1.1041 in 2014, 1.011 in 2024, 1.1086 in 2025) — so kept qualitatively.
- Dropped inflation-adjusted "$3.2 billion in 2019" endpoint: not in JSON and paired against the {{totalSpending}} shown on the page's charts.
- Dropped "10 departments accounted for 73.2%" literal (unverifiable here).
- Entity figures restored from JSON (Department of Transport 3.117478, CATSA 0.971163, VIA Rail 0.80395, Marine Atlantic 0.191686; shown on the page's Spending by Entity chart).
- Cut Oath of Office / Rideau Hall / ministerial-tenure boilerplate; folded the minister's substantive responsibilities into one line.
Section tokens (spec Part A) added, EN/FR identical, reproducing the original production component order: stats, entities, miniSankey. Unreferenced sections auto-append in default order: historicalShare, lineItems.
Figure sync (adversarial-review M1/M2/M3, 2026-07-10): total federal spending $513.9B->$521.4B (summary.json totalSpending 521.425); Dept of Transport entity $3.1B->$3.0B (entities value 3.019); COVID-era totals $410.2/$420/$720.3B -> $346.2/$373.5/$644.2B (2019/2020/2021 summary totals, accrual basis).
-->
