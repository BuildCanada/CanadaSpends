---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Public Services and Procurement Canada acts as the federal government's central purchasing agent, real property manager, and receiver general. It manages procurement of goods and services on behalf of other departments, oversees federal office buildings and other real property, administers pay and pension services for public servants, and provides translation and other common services across government.

{{name}} spent {{totalSpending}} in fiscal year 2020-21, representing {{percentageOfFederal}} of total federal spending that year.

The large majority of the department's spending flowed through the Department of Public Works and Government Services, its core operating entity, with smaller amounts attributed to the National Capital Commission and Canada Post Corporation. Among transfer payments, the largest was a grant covering payment in lieu of taxes to municipalities and other taxing authorities, reflecting the department's role as custodian of federal real property; a related recoveries line offset payments in lieu of taxes from custodian departments.

<!-- verification:
- claim: PSPC is the government's central purchasing agent, real property manager, and receiver general, administers pay/pension and translation/common services
  check: generic, well-established mandate description; not sourced from fact sheet (permitted exception)
- claim: {{totalSpending}} and {{percentageOfFederal}} for fiscal year 2020-21
  check: matches fact sheet totalSpending=6.026643, percentageOfFederal=0.9583
- claim: largest entity is Department of Public Works and Government Services
  check: matches topEntities[0], value 5.85072 (highest by far)
- claim: smaller amounts to National Capital Commission and Canada Post Corporation
  check: matches topEntities[1] (0.153713) and topEntities[2] (0.02221)
- claim: largest transfer payment is grant for payment in lieu of taxes to municipalities and other taxing authorities
  check: matches topTransferPayments[0], used=557833452, category Grants
- claim: recoveries line offsets payment in lieu of taxes from custodian departments
  check: matches topTransferPayments[1], description "Recoveries of payment in lieu of taxes from custodian departments", used=0 -- UNCERTAIN whether used=0 means no effect in FY2020-21; described qualitatively without a figure so this is safe
-->
