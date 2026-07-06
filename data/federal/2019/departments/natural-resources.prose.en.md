---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Natural Resources Canada is responsible for federal policy on energy, minerals, and forestry, and supports science and innovation in the natural resource sectors. Its portfolio includes nuclear energy safety regulation and the regulator of interprovincial and international energy infrastructure.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Natural Resources, Atomic Energy of Canada Limited, Canadian Nuclear Safety Commission, National Energy Board, and Northern Pipeline Agency. Spending was authorized across 12 parliamentary votes and statutory authorities; the largest individual funding lines were Atomic Energy of Canada Limited (Vote 1) and Department of Natural Resources (Vote 1 and Statutory amounts). Transfer payments made up a further part of spending, with programs such as Payments to the Newfoundland Offshore Petroleum Resource Revenue Fund, Contributions in support of ecoENERGY for Renewable Power, Payments to the Nova Scotia Offshore Revenue Account, Energy Innovation Program, and Clean Growth in Natural Resource Sectors Innovation Program among the larger ones by amount used.

<!-- verification:
- name: 'Energy and Natural Resources' matches departments/natural-resources.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/natural-resources.json (.totalSpending=2.507909, .percentageOfFederal=0.7424)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Natural Resources, Atomic Energy of Canada Limited, Canadian Nuclear Safety Commission, National Energy Board, Northern Pipeline Agency): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Atomic Energy of Canada Limited (Vote 1); Department of Natural Resources (Vote 1 and Statutory amounts)): present in .miniSankey top leaves by amount desc
- vote count (12): matches length of .votes array
- transfer payments named (Payments to the Newfoundland Offshore Petroleum Resource Revenue Fund, Contributions in support of ecoENERGY for Renewable Power, Payments to the Nova Scotia Offshore Revenue Account, Energy Innovation Program, Clean Growth in Natural Resource Sectors Innovation Program): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
