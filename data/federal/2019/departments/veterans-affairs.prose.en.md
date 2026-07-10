---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Veterans Affairs Canada provides benefits, health care support, and services to veterans and their families, including disability compensation and support programs. Its portfolio includes the independent board that hears veterans' appeals.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Veterans Affairs and Veterans Review and Appeal Board. Spending was authorized across 5 parliamentary votes and statutory authorities; the largest individual funding lines were Department of Veterans Affairs (Vote 5, Vote 1, and Statutory amounts). Transfer payments made up a further part of spending, with programs such as Disability Awards and Allowances, Pensions for disability and death, Earnings Loss and Supplementary Retirement Benefit, Housekeeping and Grounds Maintenance, and Contributions to Veterans, under the Veterans Independence Program among the larger ones by amount used.

<!-- verification:
- name: 'Veterans Affairs' matches departments/veterans-affairs.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/veterans-affairs.json (.totalSpending=4.700369, .percentageOfFederal=1.3914)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Veterans Affairs, Veterans Review and Appeal Board): present in .entities, sorted by value desc, matches top 2
- funding-line leaves named (Department of Veterans Affairs (Vote 5, Vote 1, and Statutory amounts)): present in .miniSankey top leaves by amount desc
- vote count (5): matches length of .votes array
- transfer payments named (Disability Awards and Allowances, Pensions for disability and death, Earnings Loss and Supplementary Retirement Benefit, Housekeeping and Grounds Maintenance, Contributions to Veterans, under the Veterans Independence Program): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
