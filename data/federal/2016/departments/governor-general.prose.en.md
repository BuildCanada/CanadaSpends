---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

The Governor General is the representative of the Crown in Canada and carries out constitutional, ceremonial, and representational duties on behalf of the Crown. The Office of the Secretary to the Governor General supports the Governor General in fulfilling these responsibilities.

In the 2015–16 fiscal year, {{name}} spent {{totalSpending}}, accounting for {{percentageOfFederal}} of total federal spending that year, one of the smallest shares of any federal department.

In FY2015–16 this spending was reported under the Office of the Governor General's Secretary and administered through a single appropriation vote. The department's only transfer payment that year consisted of annuities payable under the Governor General's Act.

<!-- verification:
- {{totalSpending}} = 0.022318 (billions), {{percentageOfFederal}} = 0.0078 per fact sheet.
- "one of the smallest shares of any federal department" — checked against summary.json ministries list; 0.0078 is at or near the bottom of the list. Qualitative, no figure attached. OK.
- "Office of the Governor General's Secretary" — matches topEntities[0].name / topSankeyChildren[0].name (fact sheet reportedAs is null; entity name used per instructions). OK.
- "single appropriation vote" — voteCount = 1. OK.
- "only transfer payment" — topTransferPayments has exactly 1 entry (annuities payable under the Governor General's Act). OK.
-->
