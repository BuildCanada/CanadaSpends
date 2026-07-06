---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Public Safety is the federal portfolio responsible for national security, policing, border services, and the correctional system. It brings together the core department, which coordinates emergency preparedness and public safety policy, with several large operational agencies and oversight bodies that carry out policing, border control, incarceration, intelligence, and parole functions.

In the 2022–23 fiscal year, Public Safety spent {{totalSpending}}, equal to {{percentageOfFederal}} of total federal spending. The Royal Canadian Mounted Police was the portfolio's largest spending entity, followed by the Department of Public Safety and Emergency Preparedness, the Correctional Service of Canada, the Canada Border Services Agency, and the Canadian Security Intelligence Service. The Parole Board of Canada, the Civilian Review and Complaints Commission for the Royal Canadian Mounted Police, and the Office of the Correctional Investigator of Canada accounted for smaller portions.

The portfolio's transfer payments, largely contributions, supported disaster assistance to the provinces, which was the largest single transfer payment, alongside compensation grants for Royal Canadian Mounted Police members injured in the line of duty. Other contributions funded the First Nations Policing Program, policing costs specific to the National Capital Region, and the Gun and Gang Violence Action Fund.

<!--
VERIFICATION: second-pass fact-check against the source fact sheet.
- "spent {{totalSpending}}, equal to {{percentageOfFederal}}" -> matches totalSpending 17.547013 and percentageOfFederal 3.7057.
- "Royal Canadian Mounted Police was the portfolio's largest spending entity, followed by the Department of Public Safety and Emergency Preparedness, the Correctional Service of Canada, the Canada Border Services Agency, and the Canadian Security Intelligence Service" -> topEntities[0-4] in exactly that descending order (7.826488, 3.314117, 3.01977, 2.621641, 0.672447).
- "Parole Board of Canada, the Civilian Review and Complaints Commission for the Royal Canadian Mounted Police, and the Office of the Correctional Investigator of Canada accounted for smaller portions" -> present in topMiniSankeyChildren[5-7], smaller amounts.
- "disaster assistance to the provinces, which was the largest single transfer payment" -> topTransferPayments[0] "Contributions to the provinces for assistance related to natural disasters", used 2423638161, the largest listed, described qualitatively.
- "compensation grants for Royal Canadian Mounted Police members injured in the line of duty" -> topTransferPayments[1] "To compensate members of the Royal Canadian Mounted Police for injuries received in the performance of duty", a Grant.
- "First Nations Policing Program" -> topTransferPayments[2], matches description exactly.
- "policing costs specific to the National Capital Region" -> topTransferPayments[3] "Contribution in support of the Nation's Capital Extraordinary Policing Costs Program".
- "Gun and Gang Violence Action Fund" -> topTransferPayments[4], matches exactly.
- Mandate paragraph is generic/uncontroversial background, not tied to specific fact-sheet figures.
-->
