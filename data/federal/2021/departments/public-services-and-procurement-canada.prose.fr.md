---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Services publics et Approvisionnement Canada agit à titre d'agent d'achat central du gouvernement fédéral, de gestionnaire des biens immobiliers et de receveur général. Le ministère gère l'approvisionnement en biens et services pour le compte d'autres ministères, supervise les immeubles fédéraux et d'autres biens immobiliers, administre la paye et les pensions des fonctionnaires, et fournit des services de traduction ainsi que d'autres services communs à l'échelle du gouvernement.

{{name}} a dépensé {{totalSpending}} au cours de l'exercice 2020-2021, ce qui représente {{percentageOfFederal}} des dépenses fédérales totales de cette année-là.

La grande majorité des dépenses du ministère est passée par le ministère des Travaux publics et des Services gouvernementaux, son entité opérationnelle principale, des montants plus modestes étant attribués à la Commission de la capitale nationale et à la Société canadienne des postes. Parmi les paiements de transfert, le plus important était une subvention couvrant les paiements versés en remplacement d'impôts aux municipalités et à d'autres autorités taxatrices, ce qui reflète le rôle du ministère à titre de gardien des biens immobiliers fédéraux; un poste connexe de recouvrement compensait les paiements versés en remplacement d'impôts par des ministères gardiens.

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
  check: matches topTransferPayments[1], used=0 -- described qualitatively without a figure, safe
- note: faithful French translation of the English version; placeholders kept verbatim in English as interpolation tokens
-->
