---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Public Safety Canada is responsible for federal policy on national security, emergency management, law enforcement, and corrections, and it coordinates the work of portfolio agencies including the Royal Canadian Mounted Police and the Canada Border Services Agency.

In the 2015–16 fiscal year, {{name}} spent {{totalSpending}}, accounting for {{percentageOfFederal}} of total federal spending that year.

In FY2015–16 this spending was reported under Public Safety and Emergency Preparedness, administered through a single appropriation vote. The largest transfer payment compensated members of the Royal Canadian Mounted Police for injuries received in the performance of duty, followed by contributions to provinces for assistance related to natural disasters. Other contributions supported the First Nations Policing Program and community safety initiatives.

<!-- verification:
- {{totalSpending}} = 11.861896 (billions), {{percentageOfFederal}} = 4.1562 per fact sheet.
- "Public Safety and Emergency Preparedness" — matches topEntities[0].name / topSankeyChildren[0].name (fact sheet reportedAs is null; entity name used per instructions). OK.
- "single appropriation vote" — voteCount = 1. OK.
- RCMP injury-compensation grants — topTransferPayments[0], largest. OK.
- Provincial natural-disaster assistance contributions — topTransferPayments[1]. OK.
- First Nations Policing Program contributions — topTransferPayments[2]. OK.
- Safer Communities Initiative contributions — topTransferPayments[3], described generally as "community safety initiatives". OK.
- RCMP and CBSA named as portfolio agencies — this is generic/well-known mandate background, not a fact-sheet-specific figure.
-->
