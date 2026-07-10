---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Natural Resources Canada is responsible for federal policy on energy, forestry, minerals and metals, and earth sciences, and administers programs supporting the development and sustainability of Canada's natural resource sectors.

In the 2015–16 fiscal year, {{name}} spent {{totalSpending}}, accounting for {{percentageOfFederal}} of total federal spending that year.

In FY2015–16 this spending was reported under Natural Resources, administered through a single appropriation vote. The largest transfer payment was a payment to the Newfoundland Offshore Petroleum Resource Revenue Fund, followed by contributions supporting renewable power generation under the ecoENERGY program. Other contributions supported the Nova Scotia Offshore Revenue Account, forest-sector innovation, and investment in forest industry transformation.

<!-- verification:
- {{totalSpending}} = 2.102173 (billions), {{percentageOfFederal}} = 0.7366 per fact sheet.
- "Natural Resources" — matches topEntities[0].name / topSankeyChildren[0].name (differs from fact sheet top-level "name": "Energy and Natural Resources"; fact sheet reportedAs is null, so entity name used per instructions as the historical FY2016 name). OK.
- "single appropriation vote" — voteCount = 1. OK.
- Newfoundland Offshore Petroleum Resource Revenue Fund payment — topTransferPayments[0], largest. OK.
- ecoENERGY for Renewable Power contributions — topTransferPayments[1]. OK.
- Nova Scotia Offshore Revenue Account payment — topTransferPayments[2]. OK.
- Forest innovation program contributions — topTransferPayments[3]. OK.
- Forest industry transformation contribution — topTransferPayments[4]. OK.
-->
