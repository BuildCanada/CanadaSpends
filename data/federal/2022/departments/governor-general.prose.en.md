---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

The Office of the Secretary to the Governor General supports the Governor General in carrying out constitutional, ceremonial, and state functions on behalf of the Crown. This includes assisting with the exercise of formal constitutional duties, organizing state and ceremonial events, administering the Canadian honours system, and maintaining the official residences used in the performance of these duties.

In fiscal year 2021-22, {{name}} spending totalled {{totalSpending}}, representing {{percentageOfFederal}} of federal spending for the year. The fact sheet for this office does not show any pandemic-related spending items for the year.

Nearly all recorded spending is attributed to a single organizational entity, the Office of the Governor General's Secretary, which also appears as the sole grouping in the available breakdown of the office's spending. The data does not show a further breakdown into multiple programs or sub-organizations, consistent with the office's small, centralized operating structure.

Among transfer payments, the office's spending includes a grant category covering annuities payable under the Governor General's Act. No other transfer payment categories or descriptions appear in the available data for this office.

<!-- verification:
- mandate description (Office of the Secretary to the Governor General; constitutional, ceremonial, state functions; honours; official residences): generic/uncontroversial, not sourced from fact sheet (allowed exception)
- {{totalSpending}}, {{percentageOfFederal}}: from fact sheet totalSpending (0.023854) and percentageOfFederal (0.0048) fields
- "fiscal year 2021-22": from financialYearEnding: 2022
- "no pandemic-related spending items shown": no entity, miniSankey child, or transfer payment name/description in the fact sheet references pandemic/COVID-19 related programs
- "single organizational entity, the Office of the Governor General's Secretary": from topEntities (one item: "Office of the Governor General's Secretary", value 0.023854) and topMiniSankeyChildren (one item, same name and amount)
- "sole grouping in the available breakdown": topMiniSankeyChildren array has exactly one entry
- "grant category covering annuities payable under the Governor General's Act": from topTransferPayments[0] (category: "Grants", description: "Annuities payable under the Governor General's Act (R.S.C., 1985 c. G-9)")
- "no other transfer payment categories or descriptions appear": topTransferPayments array in the fact sheet contains only one item
- flag: reportedAs is null for this department (no machinery-of-government name change noted), so none was mentioned
- flag: entities/miniSankey/transferPayments arrays are each sparse (single item), consistent with this being a small office; described qualitatively as instructed rather than inventing additional detail
-->
