---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Immigration, Refugees and Citizenship is the federal department responsible for Canada's immigration system, refugee protection and resettlement, and citizenship programs. It processes applications for permanent and temporary residence, supports the settlement and integration of newcomers, and administers citizenship grants. The Immigration and Refugee Board, a related tribunal within the portfolio, adjudicates refugee protection claims and immigration appeals.

{{name}} spent {{totalSpending}} in the 2022–23 fiscal year, representing {{percentageOfFederal}} of total federal spending for that year.

Nearly all of the department's spending flowed through the Department of Citizenship and Immigration, its main operating entity, with a smaller share attributed to the Immigration and Refugee Board. Transfer payments were led by the Settlement Program, which funds services to help newcomers integrate, alongside the grant for the Canada-Quebec Accord on Immigration, the Resettlement Assistance Program and related Resettlement Assistance contributions, which support refugees after arrival, and the Interim Housing Assistance Program.

<!--
VERIFICATION: second-pass fact-check against the source fact sheet.
- Mandate paragraph -> generic description of IRCC's known functions, consistent with entity names Department of Citizenship and Immigration and Immigration and Refugee Board present in the fact sheet; not tied to a specific numeric field.
- {{totalSpending}} / {{percentageOfFederal}} -> matches fact sheet totalSpending 5.50326 and percentageOfFederal 1.1622.
- "Nearly all ... flowed through the Department of Citizenship and Immigration ... smaller share ... Immigration and Refugee Board" -> supported by topEntities values 5.217783 and 0.285478 (only two entities listed).
- "Settlement Program" -> topTransferPayments[0], used 956360675.
- "grant for the Canada-Quebec Accord on Immigration" -> topTransferPayments[1], used 726729000.
- "Resettlement Assistance Program and related Resettlement Assistance contributions" -> topTransferPayments[2] (Grant for the Resettlement Assistance Program, used 495718572) and topTransferPayments[3] (Resettlement Assistance, used 415603358). FLAG: these are two distinct line items (a grant and a separate contribution) with similar names, described together for readability -- worth a reviewer confirming this doesn't read as a single program.
- "Interim Housing Assistance Program" -> topTransferPayments[4], used 164300000.
-->
