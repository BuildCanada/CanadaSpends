---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Canadian Heritage supports arts, culture, heritage, sport, and official languages programming across the country. It funds cultural institutions and events, supports Canadian content industries, and administers programs related to multiculturalism and Canadian identity.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Department of Canadian Heritage, Canadian Broadcasting Corporation, Canada Council for the Arts, Library and Archives of Canada, and National Capital Commission. Spending was authorized across 27 parliamentary votes and statutory authorities; the largest individual funding lines were Department of Canadian Heritage (Vote 5), Canadian Broadcasting Corporation (Vote 1), and Canada Council for the Arts (Vote 1). Transfer payments made up a further part of spending, with programs such as Contributions in support of the Development of Official-Language Communities Program, Contributions for the Sport Support Program, Contributions to support the Canada Media Fund, Contributions in support the Enhancement of Official Languages Program, and Grants to the Canada Periodical Fund among the larger ones by amount used.

<!-- verification:
- name: 'Canadian Heritage' matches departments/canadian-heritage.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/canadian-heritage.json (.totalSpending=3.6652, .percentageOfFederal=1.085)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Department of Canadian Heritage, Canadian Broadcasting Corporation, Canada Council for the Arts, Library and Archives of Canada, National Capital Commission): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Department of Canadian Heritage (Vote 5); Canadian Broadcasting Corporation (Vote 1); Canada Council for the Arts (Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (27): matches length of .votes array
- transfer payments named (Contributions in support of the Development of Official-Language Communities Program, Contributions for the Sport Support Program, Contributions to support the Canada Media Fund, Contributions in support the Enhancement of Official Languages Program, Grants to the Canada Periodical Fund): present in .transferPayments, sorted by used desc (top 5 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
