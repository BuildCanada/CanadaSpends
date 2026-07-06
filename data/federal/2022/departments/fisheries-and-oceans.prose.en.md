---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

{{name}} is the federal department responsible for the management and conservation of Canada's fisheries and aquatic ecosystems, the regulation of aquaculture, and the protection of Canada's oceans and waterways. The department is also responsible for the Canadian Coast Guard, which provides marine navigation aids, search and rescue services, ice-breaking, environmental response, and other marine safety functions in Canadian waters.

In the 2021-22 fiscal year, the department's reported spending was {{totalSpending}}, representing {{percentageOfFederal}} of federal spending for the year. This spending was authorized through four separate appropriation votes, covering the department's operating requirements as well as grants and contributions in support of its fisheries, oceans science, and coast guard programming.

In this dataset, the department's spending is reported as a single organizational entity, without a further breakdown into branches, regions, or agencies. A more detailed picture of departmental priorities is available through its transfer payment programs. The largest of these during the year was a contribution program in support of Indigenous Reconciliation Priorities, followed by a contribution program supporting the Integrated Aboriginal Programs Management Framework. Additional contribution programs during the year supported Aquatic Species and Aquatic Habitat, the Integrated Fish and Seafood Sector Management Framework, and Ecosystems and Oceans Science, reflecting the department's role in both Indigenous relations and the scientific management of Canada's aquatic resources.

<!-- verification:
- mandate description: generic/uncontroversial, not sourced from fact sheet (allowed exception) — fisheries management, aquaculture regulation, oceans protection, Canadian Coast Guard (navigation aids, search and rescue, ice-breaking, environmental response) are standard, uncontested descriptions of DFO/CCG's role
- {{totalSpending}}, {{percentageOfFederal}}: from fact sheet totalSpending (3.799808) and percentageOfFederal (0.7701) fields
- "four separate appropriation votes": from fact sheet voteCount (4)
- "reported as a single organizational entity, without further breakdown": confirmed — topEntities and topMiniSankeyChildren each contain exactly one item ("Department of Fisheries and Oceans") equal to totalSpending, i.e. no sub-entity breakdown exists in the data
- "contribution program in support of Indigenous Reconciliation Priorities" as largest: confirmed as top item in topTransferPayments (used: 302,981,299), category "Contributions"
- "Integrated Aboriginal Programs Management Framework": confirmed, 2nd largest topTransferPayments item (used: 108,604,815)
- "Aquatic Species and Aquatic Habitat": confirmed, 3rd largest topTransferPayments item (used: 67,971,494)
- "Integrated Fish and Seafood Sector Management Framework": confirmed, 4th largest topTransferPayments item (used: 63,041,952)
- "Ecosystems and Oceans Science": confirmed, 5th largest topTransferPayments item (used: 35,955,892)
- reportedAs: null in fact sheet, so no machinery-of-government name-change note included
- pandemic/COVID-19 spending: not mentioned, as no entity, transfer payment, or program name in the fact sheet references COVID-19/pandemic/safe restart
- flag: fact sheet's entities and miniSankey arrays are both single-item (equal to total), unusually flat for a department of this size — worth double-checking during human review whether a richer sub-entity breakdown exists elsewhere in the source data that wasn't captured by this extraction
-->
