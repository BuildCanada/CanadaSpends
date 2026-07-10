---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Public Safety Canada leads federal policy on national security, emergency management, and community safety. Its portfolio includes the Royal Canadian Mounted Police, the Canada Border Services Agency, the Correctional Service of Canada, and the Canadian Security Intelligence Service.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Royal Canadian Mounted Police, Correctional Service of Canada, Canada Border Services Agency, Department of Public Safety and Emergency Preparedness, and Canadian Security Intelligence Service. Spending was authorized across 23 parliamentary votes and statutory authorities; the largest individual funding lines were Royal Canadian Mounted Police (Vote 1), Correctional Service of Canada (Vote 1), and Canada Border Services Agency (Vote 1). Transfer payments made up a further part of spending, with programs such as To compensate members of the Royal Canadian Mounted Police for injuries received..., Contributions to the provinces for assistance related to natural disasters, Payments to the provinces, territories, municipalities, Major International Events Security Cost Framework, and Contributions in support of the Safer Communities Initiative among the larger ones by amount used.

<!-- verification:
- name: 'Public Safety' matches departments/public-safety-canada.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/public-safety-canada.json (.totalSpending=11.610393, .percentageOfFederal=3.4368)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Royal Canadian Mounted Police, Correctional Service of Canada, Canada Border Services Agency, Department of Public Safety and Emergency Preparedness, Canadian Security Intelligence Service): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Royal Canadian Mounted Police (Vote 1); Correctional Service of Canada (Vote 1); Canada Border Services Agency (Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (23): matches length of .votes array
- transfer payments named (To compensate members of the Royal Canadian Mounted Police for injuries received..., Contributions to the provinces for assistance related to natural disasters, Payments to the provinces, territories, municipalities, Major International Events Security Cost Framework, Contributions in support of the Safer Communities Initiative): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
