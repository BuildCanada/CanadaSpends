---
reviewed: true
source: hand-written (edited 2026-07-06)
---

The Department of National Defence (DND) and the Canadian Armed Forces (CAF) are responsible for ensuring Canada's security and defence through military operations, infrastructure management, and personnel support. Established in 1923 under the National Defence Act, DND oversees the defence budget, military procurement, and readiness planning, while the CAF executes domestic and international operations. The department sets strategic defence policy and works with international allies, including NATO and NORAD, and administers military health services, housing programs, and recruitment to support its personnel.

{{section:stats}}

The Department of National Defence spent {{totalSpending}} in fiscal year (FY) 2024, or {{percentageOfFederal}} of the $521.4 billion in total federal spending. This ranks it among the largest federal departments by expenditure, with spending driven largely by personnel costs, military procurement, and operational readiness.

{{section:entities}}

Federal defence spending shifts over time with geopolitical tensions, defence modernization needs, and emerging threats such as cyber warfare, and events such as Russia's invasion of Ukraine and Arctic sovereignty disputes can influence military spending. Measured as a share of the federal budget, DND has edged down over the past decade, from roughly 7.2% in 2014 to {{percentageOfFederal}} in 2024.

{{section:historicalShare}}

Almost all of this spending is reported under the Department of National Defence itself, which funds the Canadian Army, the Royal Canadian Navy, and the Royal Canadian Air Force; the Communications Security Establishment is the main separate entity in the portfolio, with two small military-oversight bodies making up the remainder. The department is led by the [Minister of National Defence](https://www.pm.gc.ca/en/cabinet/honourable-bill-blair), a member of [cabinet](https://www.pm.gc.ca/en/cabinet) appointed by the Governor General on the advice of the Prime Minister, who is responsible for defence policy, military operations, and procurement.

{{section:miniSankey}}

<!--
Figure decisions (FY2024 basis = Volume II; department JSON totalSpending 34.848181, percentageOfFederal 6.7806):
- Old page literals "$34.5B" / "6.7%" replaced with {{totalSpending}} ($34.85B) / {{percentageOfFederal}} (6.8%).
- "$513.9 billion" total federal retained (matches summary.json 513.936).
- Dropped "74.9%" / "59.9%" (since-1995 growth) and "0.6 percentage points lower than 1995": not verifiable in JSON. Direction (declining share) is JSON-supported, so replaced with the decade trend ~7.8% (2014) -> {{percentageOfFederal}} (2024) from historicalShare (7.762 -> 6.7806; continues to 6.5109 in 2025).
- Dropped "10 departments accounted for 73.2%" literal (unverifiable here); folded qualitatively.
- CORRECTED the old claim that "the largest spending entities within DND were the Canadian Army, the Royal Canadian Navy, and the Royal Canadian Air Force" — this contradicts the page's Spending by Entity chart. JSON entities are Department of National Defence (33.805584), Communications Security Establishment (1.029201), and two tiny review bodies; the Army/Navy/Air Force are internal commands, not separate accounting entities. Reframed accordingly.
- Cut Oath/tenure boilerplate and the direct-vs-indirect definitional paragraph.
Section tokens (spec Part A) added, EN/FR identical, reproducing the original production component order: stats, entities, historicalShare, miniSankey. Unreferenced sections auto-append in default order: lineItems.
Figure sync (adversarial-review M1/M2/M3, 2026-07-10): total federal spending $513.9B->$521.4B (summary.json totalSpending 521.425); 2014 share 7.8%->7.2% (historicalShare 2014 = 7.2132).
-->
