---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Veterans Affairs provides benefits, services, and compensation programs for Canada's veterans and their families. Its work includes administering disability and survivor benefits, supporting health and rehabilitation services, and helping veterans transition to civilian life. The department also plays a role in commemorating the service and sacrifice of Canada's veterans.

{{name}} spent {{totalSpending}} in the 2022–23 fiscal year, representing {{percentageOfFederal}} of total federal spending that year.

The Department of Veterans Affairs accounts for nearly all of the portfolio's spending, with the Veterans Review and Appeal Board, which handles appeals related to disability benefit decisions, representing a much smaller share. Spending is directed primarily through a range of grant programs paid to veterans and their families, with Pain and Suffering Compensation among the largest, alongside the Income Replacement Benefit, pensions for disability and death, Housekeeping and Grounds Maintenance benefits, and Additional Pain and Suffering Compensation.

<!--
VERIFICATION: second-pass fact-check against the source fact sheet.
- "provides benefits, services, and compensation programs for Canada's veterans and their families... disability and survivor benefits... health and rehabilitation... transition to civilian life... commemorating" -> generic, well-established description of Veterans Affairs Canada's mandate; not a specific fact sheet claim.
- {{totalSpending}} / {{percentageOfFederal}} for 2022-23 -> matches totalSpending 5.435965 and percentageOfFederal 1.148; financialYearEnding 2023 matches summary.
- "Department of Veterans Affairs accounts for nearly all of the portfolio's spending" -> matches topEntities[0] (5.422345) against total 5.435965, i.e. nearly the entire total, consistent with "nearly all."
- "Veterans Review and Appeal Board... representing a much smaller share" -> matches topEntities[1] (0.01362), far smaller than topEntities[0]; "handles appeals related to disability benefit decisions" is a generic descriptor of that board's known function, not itself in the fact sheet -- flagged as a minor unsourced elaboration, though consistent with the entity's public name/mandate.
- "Pain and Suffering Compensation among the largest" -> matches topTransferPayments[0] (used 1,387,239,972), the largest of five.
- "Income Replacement Benefit" -> matches topTransferPayments[1].
- "pensions for disability and death" -> matches topTransferPayments[2] description (abbreviated from the full legislative description).
- "Housekeeping and Grounds Maintenance benefits" -> matches topTransferPayments[3].
- "Additional Pain and Suffering Compensation" -> matches topTransferPayments[4].
- All five transfer payments listed are category "Grants" per fact sheet, consistent with describing them as "grant programs paid to veterans and their families."
-->
