---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

The Canada Revenue Agency administers federal tax laws, collects revenue, and delivers benefit payments on behalf of the federal government and many provinces and territories. It also administers child and family benefit programs delivered through the tax system.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Spending was concentrated within Canada Revenue Agency. Spending was authorized across 3 parliamentary votes and statutory authorities; the largest individual funding lines were Canada Revenue Agency (Vote 1, Statutory amounts, and Vote 5). Transfer payments made up a further part of spending, with programs such as Climate action incentive payments and Children's Special Allowance payments among the larger ones by amount used.

<!-- verification:
- name: 'National Revenue' matches departments/canada-revenue-agency.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/canada-revenue-agency.json (.totalSpending=5.477248, .percentageOfFederal=1.6213)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Canada Revenue Agency): present in .entities, sorted by value desc, matches top 1
- funding-line leaves named (Canada Revenue Agency (Vote 1, Statutory amounts, and Vote 5)): present in .miniSankey top leaves by amount desc
- vote count (3): matches length of .votes array
- transfer payments named (Climate action incentive payments, Children's Special Allowance payments): present in .transferPayments, sorted by used desc (top 2 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
