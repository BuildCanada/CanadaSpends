---
reviewed: true
source: hand-written (edited 2026-07-06)
---

The Department of Finance (Finance Canada) is a central federal department responsible for overseeing the nation's economic and fiscal policies, ensuring financial stability, and managing the government's fiscal framework. Established in 1867 as one of the original departments following Confederation, it advises the Prime Minister and Cabinet on economic matters, develops tax and tariff policies, and prepares the annual federal budget.

{{section:stats}}

The Department of Finance spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $513.9 billion in overall federal spending—the largest total of any federal department.

{{section:entities}}

Most of that spending flows to provinces, territories, and other levels of government as major statutory transfers rather than as departmental programs. In FY 2024 the largest were the Canada Health Transfer ($49.4 billion), fiscal equalization ($24.0 billion), and the Canada Social Transfer ($16.4 billion), along with territorial financing ($4.8 billion).

{{section:historicalShare}}

Beyond the core department, Finance Canada's portfolio includes several arm's-length entities. In FY 2024 those with the highest expenditures were the Office of the Superintendent of Financial Institutions, the Office of the Auditor General, and the Financial Transactions and Reports Analysis Centre of Canada.

{{section:miniSankey}}

The department is led by the [Minister of Finance](https://www.canada.ca/en/government/ministers/dominic-leblanc.html), who is appointed by the Governor General on the advice of the Prime Minister and sworn into office at Rideau Hall as a member of the King's Privy Council for Canada. The minister is one of the [cabinet members](https://www.pm.gc.ca/en/cabinet) who serve at the Prime Minister's discretion, remaining in the role until a successor is sworn in.

<!--
Figures: EN spending para already used {{totalSpending}} ($136.11B) and
{{percentageOfFederal}} (26.5%), matching the JSON (vol2_appropriations) and charts.
"$513.9 billion" total federal spending retained (matches summary.json).
Dropped "66.2% transferred to provinces and territories": transferPayments in the JSON
sum to ~$98.3B (~72% of total), of which ~$97.2B is major prov/terr transfers, so 66.2%
conflicts with the data. Replaced with the specific major transfer programs, each
verified against transferPayments: Canada Health Transfer $49.4B, Fiscal Equalization
$24.0B, Canada Social Transfer $16.4B, Territorial Financing $4.8B.
Entities (OSFI, Office of the Auditor General, FINTRAC) verified as top entities in JSON.
Dropped "since 1995 / +74.9% / +41.4%" (pre-2014 data absent from JSON; share actually
fell from 33.3% in 2014 to ~26.5% in 2024, so "increased" is wrong) and the pandemic
totals ($410.2B/$420B/$720.3B — overall federal figures, not Finance-specific, unverifiable).
Dropped generic direct/indirect boilerplate.
Section tokens (spec Part A) added, EN/FR identical, reproducing the original production component order: stats, entities, historicalShare, miniSankey. Unreferenced sections auto-append in default order: lineItems.
-->
