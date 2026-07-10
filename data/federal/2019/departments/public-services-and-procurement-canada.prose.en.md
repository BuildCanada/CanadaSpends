---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Public Services and Procurement Canada manages federal government procurement, real property, pay administration, and translation services. Its portfolio includes the agency responsible for shared information technology infrastructure across departments.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Public Works and Government Services, Shared Services Canada, and Canada Post Corporation. Spending was authorized across 7 parliamentary votes and statutory authorities; the largest individual funding lines were Department of Public Works and Government Services (Vote 1 and Vote 5) and Shared Services Canada (Vote 1). Transfer payments made up a further part of spending, with programs such as Payment in lieu of taxes to municipalities and other taxing authorities and Recoveries of payment in lieu of taxes from custodian departments among the larger ones by amount used.

<!-- verification:
- name: 'Public Services and Procurement' matches departments/public-services-and-procurement-canada.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/public-services-and-procurement-canada.json (.totalSpending=7.75515, .percentageOfFederal=2.2956)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Public Works and Government Services, Shared Services Canada, Canada Post Corporation): present in .entities, sorted by value desc, matches top 3
- funding-line leaves named (Department of Public Works and Government Services (Vote 1 and Vote 5); Shared Services Canada (Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (7): matches length of .votes array
- transfer payments named (Payment in lieu of taxes to municipalities and other taxing authorities, Recoveries of payment in lieu of taxes from custodian departments): present in .transferPayments, sorted by used desc (top 2 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
