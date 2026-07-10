---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Parliament's budget funds the operations of the Senate, the House of Commons, and the Library of Parliament.

{{name}} spent {{totalSpending}} in the 2016–17 fiscal year, representing {{percentageOfFederal}} of total federal spending that year, appropriated through the Public Accounts of Canada (Volume II, appropriations basis).

Transfer payments made up a minor part of Parliament's overall spending, which was mostly made up of its core appropriation. Of the transfer payments that were made, contributions to parliamentary and procedural associations were the largest, alongside a smaller grant program providing pensions to retired senators.

<!-- verification:
- name/totalSpending/percentageOfFederal: placeholders, interpolated at render time from JSON; not asserted as literal figures here.
- Mandate paragraph: generic/standard description of Parliament's appropriation, not sourced from this department-year's JSON beyond the entity name (permitted per instructions).
- No "reported-as" note needed: fact sheet topEntities[0].name ("Parliament") matches the department's current name.
- Named programs: "Payments to Parliamentary and Procedural Associations" and "Contributions to Parliamentary Associations" (both Contributions), "Pensions to Retired Senators" (Grants) — all confirmed present in topTransferPayments fact sheet (only 3 entries total, transferPaymentsCount: 3).
- "Minor part of overall spending" reflects that transferPaymentsCount is only 3 modest entries against a much larger totalSpending; kept qualitative, no figures stated.
-->
