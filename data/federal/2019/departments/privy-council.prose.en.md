---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

The Privy Council Office is the central agency that supports the Prime Minister and Cabinet. Its portfolio includes the Public Service Commission and other bodies responsible for public service staffing, official languages oversight, and transportation accident investigation.

{{name}} spent {{totalSpending}} in the 2018–19 fiscal year, the period covered by the Public Accounts of Canada for that year. On a Volume II appropriations basis, this represented {{percentageOfFederal}} of total federal spending for the year.

Within the portfolio, the largest share of spending was reported by Privy Council Office, Public Service Commission, Canadian Transportation Accident Investigation and Safety Board, Office of the Commissioner of Official Languages, and Canadian Intergovernmental Conference Secretariat. Spending was authorized across 12 parliamentary votes and statutory authorities; the largest individual funding lines were Privy Council Office (Vote 1), Public Service Commission (Vote 1), and Canadian Transportation Accident Investigation and Safety Board (Vote 1). Transfer payments made up a further part of spending, with programs such as National Inquiry into Missing and Murdered Indigenous Women and Girls among the larger ones by amount used.

<!-- verification:
- name: 'Privy Council' matches departments/privy-council.json .name
- totalSpending/percentageOfFederal: placeholders only, sourced from departments/privy-council.json (.totalSpending=0.375459, .percentageOfFederal=0.1111)
- fiscal year 2018-19: matches data/federal/2019/summary.json financialYear
- basis: vol2_appropriations per source JSON basis field (not stated verbatim in prose)
- top entities named (Privy Council Office, Public Service Commission, Canadian Transportation Accident Investigation and Safety Board, Office of the Commissioner of Official Languages, Canadian Intergovernmental Conference Secretariat): present in .entities, sorted by value desc, matches top 5
- funding-line leaves named (Privy Council Office (Vote 1); Public Service Commission (Vote 1); Canadian Transportation Accident Investigation and Safety Board (Vote 1)): present in .miniSankey top leaves by amount desc
- vote count (12): matches length of .votes array
- transfer payments named (National Inquiry into Missing and Murdered Indigenous Women and Girls): present in .transferPayments, sorted by used desc (top 1 unique descriptions; exact duplicate descriptions in the source, if any, were collapsed)
- No literal $ or % figures used; only {{name}}, {{totalSpending}}, {{percentageOfFederal}} placeholders.
- Mandate paragraph is generic/uncontroversial background, not sourced from this fact sheet.
-->
