---
reviewed: true
source: hand-written (edited 2026-07-06)
---

Established in 2005, Employment and Social Development Canada (ESDC) is a federal department responsible for supporting Canadians through social programs and workforce development. It administers key programs such as Employment Insurance (EI), the Canada Pension Plan (CPP), Old Age Security (OAS), and skills training initiatives, and it oversees Service Canada, which delivers government services directly to the public.

ESDC spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $513.9 billion in overall federal spending, making it one of the highest-spending federal departments.

The bulk of ESDC's spending flows directly to individuals and provinces as statutory transfers rather than departmental operations. In FY 2024 the largest were Old Age Security ($57.4 billion) and the Guaranteed Income Supplement ($18.0 billion), followed by transfers to provinces and territories for early learning and child care ($6.2 billion) and Canada Student Grants ($2.7 billion). Employment Insurance and the Canada Pension Plan operate through separate accounts and fall outside the department's appropriations shown here.

The department's spending is sensitive to economic conditions and major legislation. Federal income-support programs drove a sharp, temporary increase during the COVID-19 pandemic before spending returned to lower levels in the years that followed.

The department is led by the [Minister of Jobs and Families](https://www.canada.ca/en/employment-social-development.html), who is appointed by the Governor General on the advice of the Prime Minister and sworn into office at Rideau Hall as a member of the King's Privy Council for Canada. The minister is one of the [cabinet members](https://www.pm.gc.ca/en/cabinet) who serve at the Prime Minister's discretion, remaining in the role until a successor is sworn in.

<!--
Figures: EN spending para uses {{totalSpending}} ($97.28B) and {{percentageOfFederal}}
(18.9%), matching the JSON (vol2_appropriations) and charts. The old FR literals
"94,48 milliards" / "18,4 %" were replaced by tokens.
"$513.9 billion" retained (matches summary.json).
Dropped "63% transferred to individuals and provinces": transferPayments in the JSON sum
to ~$92.0B (~95% of total), so 63% conflicts. Replaced with the specific top transfers,
each verified against transferPayments: OAS $57.4B, GIS $18.0B, early learning/child care
$6.2B, Canada Student Grants $2.7B. Added a note that EI/CPP sit in separate accounts
outside these appropriations (explains why the department total is lower than headline
program spending).
Dropped "since 2005 / +62.9% / +1,485% / 16.51 pp higher than 2005" (pre-2014 data absent
from JSON; share actually fell 21.4%→18.9% since 2014) and the pandemic totals
($63.3B/$169.2B — old basis, unverifiable); kept the pandemic surge qualitatively.
Dropped generic direct/indirect boilerplate and the truncated entity list (top entities
beyond the core department are sub-$25M and non-informative).
-->
