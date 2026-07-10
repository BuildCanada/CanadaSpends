---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

The Treasury Board Secretariat supports the Treasury Board in its role as the government's management board, overseeing expenditure management, financial and administrative policy, and the federal public service employer function. Its portfolio includes public service training and oversight bodies for integrity and lobbying.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Treasury Board Secretariat, Canada School of Public Service, Office of the Public Sector Integrity Commissioner, and Office of the Commissioner of Lobbying. Spending was authorized across 15 parliamentary votes and statutory authorities; the largest individual funding lines were Treasury Board Secretariat (Vote 20, Statutory amounts, and Vote 1). Transfer payments made up a further part of spending, with programs such as Contributions under the Research and Policy Initiatives Assistance Program, Payments, in the nature of Workers' Compensation, Contributions to the Open Government Partnership, International Federation of Accountants, and Contributions for access to legal advice under the Public Servants Disclosure Protection... among the larger ones by amount used.

<!-- verification:
- name: 'Treasury Board' matches departments/treasury-board.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/treasury-board.json (.totalSpending=6.921417, .percentageOfFederal=2.0488)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Treasury Board Secretariat, Canada School of Public Service, Office of the Public Sector Integrity Commissioner, Office of the Commissioner of Lobbying): present in .entities, sorted by value desc, matches top 4
- funding-line leaves named (Treasury Board Secretariat (Vote 20, Statutory amounts, and Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (15): matches length of .votes array
- transfer payments named (Contributions under the Research and Policy Initiatives Assistance Program, Payments, in the nature of Workers' Compensation, Contributions to the Open Government Partnership, International Federation of Accountants, Contributions for access to legal advice under the Public Servants Disclosure Protection...): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
