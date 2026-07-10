---
reviewed: false
source: llm-first-pass
generated: 2026-07-06
---

Housing, Infrastructure and Communities is responsible for federal investment in public infrastructure, including transportation systems, public transit, drinking water and wastewater systems, and other community facilities, as well as federal housing policy and programs. It works with provincial, territorial, municipal and Indigenous partners to co-fund infrastructure projects and support the construction, repair and renewal of housing across the country. Much of its work is carried out through long-term funding agreements and dedicated infrastructure programs rather than direct service delivery.

In the 2020–21 fiscal year, {{name}} spent {{totalSpending}}, representing {{percentageOfFederal}} of total federal spending. As with many federal departments, most of this spending flows either directly through departmental programs or indirectly as transfer payments to provinces, territories, municipalities, and other organizations that carry out infrastructure and housing projects on the ground.

Most of the department's spending was administered through the Office of Infrastructure of Canada, with smaller amounts administered by the Windsor-Detroit Bridge Authority and The Jacques-Cartier and Champlain Bridges Inc. Among transfer payments, the largest was the Gas Tax Fund, followed by the New Building Canada Fund's Provincial-Territorial Infrastructure Component—National and Regional Projects, the Investing in Canada Infrastructure Program, the Public Transit Infrastructure Fund, and the Clean Water and Wastewater Fund. Together these programs represent a mix of long-standing and newer contribution funding aimed at different categories of municipal and regional infrastructure.

<!-- verification:
- claim: mandate description (infrastructure, transit, water systems, housing, works with provincial/territorial/municipal/Indigenous partners) — generic background per allowed exception
  check: consistent with department name "Housing, Infrastructure and Communities" and lead entity "Office of Infrastructure of Canada"; not itself drawn from fact sheet fields, per the permitted mandate-description exception
- claim: {{totalSpending}} / {{percentageOfFederal}} for 2020–21
  check: matches fact sheet totalSpending=6.165135 (billions), percentageOfFederal=0.9803
- claim: largest entity is Office of Infrastructure of Canada
  check: matches topEntities[0]/topMiniSankeyChildren[0], value 5.492388 of 6.165135 total
- claim: Windsor-Detroit Bridge Authority and The Jacques-Cartier and Champlain Bridges Inc. as smaller entities
  check: matches topEntities[1] (0.440674) and topEntities[2] (0.232073)
- claim: largest transfer payment is the Gas Tax Fund
  check: matches topTransferPayments[0], description "Gas Tax Fund (Keeping Canada's Economy and Jobs Growing Act)", used 2,170,315,887 — shortened to "Gas Tax Fund" for readability, full legislative title preserved in fact sheet
- claim: New Building Canada Fund PT Infrastructure Component, Investing in Canada Infrastructure Program, Public Transit Infrastructure Fund, Clean Water and Wastewater Fund named in descending order
  check: matches topTransferPayments[1..4] exactly, order by used descending
- claim: no COVID-19-specific program named
  check: no entry in fact sheet (entities, miniSankey children, or transfer payments) references COVID/pandemic relief for this department; no pandemic-specific claim made, only generic direct/indirect spending framing
-->
