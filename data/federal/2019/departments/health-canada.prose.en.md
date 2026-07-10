---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Health Canada sets national health policy and regulates the safety of food, drugs, and consumer products. Its portfolio includes agencies responsible for public health, health research funding, and food inspection.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Health, Canadian Institutes of Health Research, Canadian Food Inspection Agency, Public Health Agency of Canada, and Patented Medicine Prices Review Board. Spending was authorized across 16 parliamentary votes and statutory authorities; the largest individual funding lines were Department of Health (Vote 10 and Vote 1) and Canadian Institutes of Health Research (Vote 5). Transfer payments made up a further part of spending, with programs such as Grants for research projects and personnel support, Strengthening Canada's Home and Community Care and Mental Health and Addiction Initiative, Payments to provinces and territories for the purpose of emergency treatment funding, Contribution to the Canadian Institute for Health Information, and Contributions to non-profit organizations to support, on a long-term basis among the larger ones by amount used.

<!-- verification:
- name: 'Health' matches departments/health-canada.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/health-canada.json (.totalSpending=5.138041, .percentageOfFederal=1.5209)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Health, Canadian Institutes of Health Research, Canadian Food Inspection Agency, Public Health Agency of Canada, Patented Medicine Prices Review Board): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Department of Health (Vote 10 and Vote 1); Canadian Institutes of Health Research (Vote 5)): present in .miniSankey top leaves by amount desc
- vote count (16): matches length of .votes array
- transfer payments named (Grants for research projects and personnel support, Strengthening Canada's Home and Community Care and Mental Health and Addiction Initiative, Payments to provinces and territories for the purpose of emergency treatment funding, Contribution to the Canadian Institute for Health Information, Contributions to non-profit organizations to support, on a long-term basis): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
