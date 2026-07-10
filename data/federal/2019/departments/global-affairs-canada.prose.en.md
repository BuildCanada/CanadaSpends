---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Global Affairs Canada leads Canada's diplomatic relations, international trade policy, and international development assistance. It operates Canada's network of embassies and consulates and administers foreign aid programming.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Foreign Affairs, Trade and Development, International Development Research Centre, Invest in Canada Hub, Export Development Canada (Canada Account), and International Joint Commission (Canadian Section). Spending was authorized across 11 parliamentary votes and statutory authorities; the largest individual funding lines were Department of Foreign Affairs, Trade and Development (Vote 10, Vote 1, and Statutory amounts). Transfer payments made up a further part of spending, with programs such as Grants from the International Development Assistance for Multilateral Programming, Contributions from the International Development Assistance for Bilateral Programming..., Contributions from the International Development Assistance for Partnerships..., Payments to International Financial Institutions—Direct payments, and United Nations peacekeeping operations among the larger ones by amount used.

<!-- verification:
- name: 'Global Affairs' matches departments/global-affairs-canada.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/global-affairs-canada.json (.totalSpending=7.263325, .percentageOfFederal=2.1501)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Foreign Affairs, Trade and Development, International Development Research Centre, Invest in Canada Hub, Export Development Canada (Canada Account), International Joint Commission (Canadian Section)): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Department of Foreign Affairs, Trade and Development (Vote 10, Vote 1, and Statutory amounts)): present in .miniSankey top leaves by amount desc
- vote count (11): matches length of .votes array
- transfer payments named (Grants from the International Development Assistance for Multilateral Programming, Contributions from the International Development Assistance for Bilateral Programming..., Contributions from the International Development Assistance for Partnerships..., Payments to International Financial Institutions—Direct payments, United Nations peacekeeping operations): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
