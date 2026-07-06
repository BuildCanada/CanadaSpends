---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Parliament is the federal portfolio covering the institutions of Canada's legislative branch, including the House of Commons, the Senate, and the administrative bodies that support their operations. Its spending funds the day-to-day functioning of Parliament, the security of the parliamentary precinct, legislative and research support, and a number of independent offices that report to Parliament.

In the 2022–23 fiscal year, Parliament spent {{totalSpending}}, equal to {{percentageOfFederal}} of total federal spending. The House of Commons accounted for the largest share of this spending, followed by the Senate and the Parliamentary Protective Service, which provides security within the parliamentary precinct. The Library of Parliament and smaller offices, including the Office of the Conflict of Interest and Ethics Commissioner, the Office of the Parliamentary Budget Officer, the Secretariat of the National Security and Intelligence Committee of Parliamentarians, and the Office of the Senate Ethics Officer, made up the remainder.

Parliament's transfer payments were limited compared to its overall spending, and consisted mainly of contributions to parliamentary and procedural associations and groups, along with a small grant program covering pensions payable to widows of former members.

<!--
VERIFICATION: second-pass fact-check against the source fact sheet.
- "spent {{totalSpending}}, equal to {{percentageOfFederal}}" -> matches totalSpending 0.861732 and percentageOfFederal 0.182.
- "House of Commons accounted for the largest share... followed by the Senate and the Parliamentary Protective Service" -> topEntities/topMiniSankeyChildren ranks House of Commons 0.583254, Senate 0.1049, Parliamentary Protective Service 0.10278; Senate and Parliamentary Protective Service are very close in value (0.1049 vs 0.10278) but Senate is marginally higher, order used matches fact sheet.
- "Parliamentary Protective Service, which provides security within the parliamentary precinct" -> name-derived description of the entity's evident function, not an added fact beyond its name.
- "Library of Parliament and smaller offices, including..." -> Library of Parliament, Office of the Conflict of Interest and Ethics Commissioner, Office of the Parliamentary Budget Officer, Secretariat of the National Security and Intelligence Committee of Parliamentarians, and Office of the Senate Ethics Officer all appear in topMiniSankeyChildren in descending order.
- "transfer payments were limited compared to its overall spending" -> transferPaymentsCount is 3 against a much larger totalSpending base and voteCount of 16, qualitative comparison, no figures used.
- "mainly of contributions to parliamentary and procedural associations and groups" -> topTransferPayments[0] "Payments to Parliamentary and Procedural Associations" and topTransferPayments[1] "Contributions to Parliamentary Associations and Group(s)", the two largest by used amount.
- "small grant program covering pensions payable to widows of former members" -> topTransferPayments[2] "Payments out of Consolidated Revenue Fund for pensions to widows of former members", the smallest of the three and the only Grant category, described qualitatively as "small" relative to the other two contribution items without citing its figure.
- Mandate paragraph is generic/uncontroversial background, not tied to specific fact-sheet figures.
-->
