---
reviewed: true
source: hand-written (edited 2026-07-06)
---

The Department of Innovation, Science and Industry (ISED) is the federal department responsible for fostering economic growth, technological advancement, and scientific research in Canada. It plays a key role in supporting businesses, funding research and development, and shaping policies that aim to enhance innovation, industrial competitiveness, and the prosperity of the Canadian economy.

{{section:stats}}

ISED spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $513.9 billion in overall federal spending, ranking eleventh among federal departments and placing it just outside the ten largest departments that together account for the large majority of federal spending.

{{section:entities}}

Federal spending shifts over time with population growth, changes in policy and programs, and emerging priorities, and acute events can move it sharply from year to year: during the COVID-19 pandemic, the Government of Canada's total expenses rose from $410.2 billion in 2019 to $420 billion in 2020 and $720.3 billion in 2021. ISED's own spending has grown over the long run, but its share of the federal budget has held close to {{percentageOfFederal}} over the past decade.

{{section:miniSankey}}

ISED's budget is spread across several entities. The Department of Industry itself accounts for roughly $4.5 billion, with the balance flowing to science and research bodies in the portfolio — the National Research Council of Canada, the granting councils (the Natural Sciences and Engineering Research Council and the Social Sciences and Humanities Research Council), Statistics Canada, and the Canadian Space Agency, among others. The department is led by the Minister of Innovation, Science and Industry, a member of cabinet appointed by the Governor General on the advice of the Prime Minister.

<!--
Figure decisions (FY2024 basis = Volume II; department JSON totalSpending 10.010487, percentageOfFederal 1.9478):
- Old page literals "$10.2B" / "2%" replaced with {{totalSpending}} ($10.01B) / {{percentageOfFederal}} (1.9%); the old $10.2B/2% were on a slightly different basis, so placeholders keep the prose consistent with the charts.
- "$513.9 billion" overall federal and "eleventh" rank retained (from original page; $513.9B matches summary.json 513.936).
- COVID totals $410.2B/$420B/$720.3B retained (original hand-written page; historical, not FY2024).
- Dropped "74.9%" (federal since 1995), "90.3%" (ISED since 1995), "0.17 percentage points higher than 1995" and the "share has increased" framing: not verifiable in JSON, and historicalShare shows the share essentially FLAT (1.955% in 2014 vs 1.9478% in 2024), contradicting a rising-share story. Replaced with "held close to {{percentageOfFederal}} over the past decade" (JSON-supported).
- Dropped inflation-adjusted "$6.5 billion in 2019" endpoint: not in JSON and paired against the {{totalSpending}} shown on the page's charts.
- Dropped "10 departments accounted for 73.2%" literal (unverifiable here); folded qualitatively.
- Entity figures/names restored from JSON entities (Department of Industry 4.469299, NRC 1.525981, NSERC 1.383259, SSHRC 1.160335, Statistics Canada 0.873709, Canadian Space Agency 0.450747; shown on the page's Spending by Entity chart).
- Cut Oath of Office / Rideau Hall / ministerial-tenure boilerplate.
Section tokens (spec Part A) added, EN/FR identical, reproducing the original production component order: stats, entities, miniSankey. Unreferenced sections auto-append in default order: historicalShare, lineItems.
-->
