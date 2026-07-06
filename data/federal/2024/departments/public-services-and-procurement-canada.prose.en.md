---
reviewed: true
source: hand-written (edited 2026-07-06)
---

Public Services and Procurement Canada (PSPC) is the federal department responsible for centralized procurement, real estate management, pay and pension administration for federal employees, and translation services across the Government of Canada. It works to ensure that government departments have the goods, services, and infrastructure they need to operate while maintaining transparency, fairness, and value for taxpayers.

PSPC spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $513.9 billion in overall federal spending. As a common-service provider, most of its budget funds procurement, accommodation, and information-technology services used by other departments rather than programs delivered directly to the public.

Federal spending shifts over time with population growth, changes in policy and programs, and emerging priorities, and acute events can move it sharply: during the COVID-19 pandemic, the Government of Canada's total expenses rose from $410.2 billion in 2019 to $420 billion in 2020 and $720.3 billion in 2021. Measured as a share of the federal budget, PSPC has trended down over the past decade, from roughly 3.2% in 2014 to {{percentageOfFederal}} in 2024.

PSPC's spending is split across a few entities. The Department of Public Works and Government Services accounts for roughly $6.9 billion and Shared Services Canada — which delivers common information-technology infrastructure to the federal government — for roughly $3.7 billion, with smaller amounts flowing through bodies such as the National Capital Commission. The department is led by the Minister of Government Transformation, Public Services and Procurement, a member of cabinet appointed by the Governor General on the advice of the Prime Minister.

<!--
Figure decisions (FY2024 basis = Volume II; department JSON totalSpending 10.676222, percentageOfFederal 2.0773):
- Old page literals "$8.3B" / "1.6%" replaced with {{totalSpending}} ($10.68B) / {{percentageOfFederal}} (2.1%). The old $8.3B basis excluded Shared Services Canada; the generated total includes it (entities: Dept of Public Works and Government Services 6.865886 + Shared Services Canada 3.691224 + NCC 0.096902 + Canada Post 0.02221), which explains the higher figure.
- "$513.9 billion" total federal retained (matches summary.json 513.936).
- Dropped "twelfth" rank: it was based on the old $8.3B basis and is unreliable against the higher generated total; omitted rather than asserting an unverifiable rank.
- Dropped "7.1%" (PSPC since 1995), "74.9%" (federal since 1995) and "1 percentage point lower than 1995": not verifiable in JSON and computed on the old (smaller) basis. Direction is JSON-supported, so replaced with the decade trend ~3.2% (2014) -> {{percentageOfFederal}} (2024) from historicalShare (3.2069 -> 2.0773; 1.9423 in 2025).
- Dropped inflation-adjusted endpoints "$6.8B (2019)"/"$5.3B (2021)": not in JSON and on a basis that excludes Shared Services Canada, so they would conflict with {{totalSpending}}.
- Dropped "10 departments accounted for 73.2%" literal (unverifiable here).
- Entity figures restored from JSON (PWGSC ~$6.9B, Shared Services Canada ~$3.7B; shown on the page's Spending by Entity chart).
- Cut Oath of Office / Rideau Hall / ministerial-tenure boilerplate.
-->
