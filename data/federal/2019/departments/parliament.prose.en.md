---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

This portfolio funds the operations of Canada's legislative branch, including the House of Commons, the Senate, and the Library of Parliament, as well as bodies that provide security and ethics oversight for parliamentarians.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by House of Commons, Senate, Parliamentary Protective Service, Library of Parliament, and Office of the Conflict of Interest and Ethics Commissioner. Spending was authorized across 16 parliamentary votes and statutory authorities; the largest individual funding lines were House of Commons (Vote 1 and Statutory amounts) and Parliamentary Protective Service (Vote 1). Transfer payments made up a further part of spending, with programs such as Payments to Parliamentary and Procedural Associations, Contributions to Parliamentary Associations, Payments out of Consolidated Revenue Fund for pensions to widows of former members, and Items not required for the current year among the larger ones by amount used.

<!-- verification:
- name: 'Parliament' matches departments/parliament.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/parliament.json (.totalSpending=0.765701, .percentageOfFederal=0.2267)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (House of Commons, Senate, Parliamentary Protective Service, Library of Parliament, Office of the Conflict of Interest and Ethics Commissioner): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (House of Commons (Vote 1 and Statutory amounts); Parliamentary Protective Service (Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (16): matches length of .votes array
- transfer payments named (Payments to Parliamentary and Procedural Associations, Contributions to Parliamentary Associations, Payments out of Consolidated Revenue Fund for pensions to widows of former members, Items not required for the current year): present in .transferPayments, sorted by used desc (top 4 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
