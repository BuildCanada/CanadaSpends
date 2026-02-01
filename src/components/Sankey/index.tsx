"use client";

import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";
import { SankeyChart } from "./SankeyChart";
import { SankeyData } from "./SankeyChartD3";

export function Sankey() {
  const { t } = useLingui();

  const data = useMemo(() => {
    return JSON.parse(
      JSON.stringify({
        total: 513.94,
        spending: 513.94,
        revenue: 459.53,
        spending_data: {
          name: t`Spending`,
          children: [
            {
              name: t`Economy and Standard of Living`,
              children: [
                {
                  name: t`Standard of Living and Assistance to Address Inequalities`,
                  children: [
                    {
                      name: t`Health`,
                      children: [
                        {
                          name: t`Health Research`,
                          amount: 1.35,
                        },
                        {
                          name: t`Health Care Systems + Protection`,
                          amount: 6.85,
                        },
                        {
                          name: t`Food Safety`,
                          amount: 1.08,
                        },
                        {
                          name: t`Public Health + Disease Prevention`,
                          amount: 4.43,
                        },
                      ],
                    },
                    {
                      name: t`Standard of Living`,
                      children: [
                        {
                          name: t`Revenue Canada`,
                          amount: 6.94,
                        },
                        {
                          name: t`Employment + Training`,
                          amount: 28.26,
                        },
                        {
                          name: t`Housing Assistance`,
                          amount: 5.43,
                        },
                        {
                          name: t`Gender Equality`,
                          amount: 0.32,
                        },
                        {
                          name: t`Official Languages + Culture`,
                          amount: 4.78,
                        },
                        {
                          name: t`Support for Veterans`,
                          amount: 6.07,
                        },
                        {
                          name: t`Carbon Tax Rebate`,
                          amount: 9.86,
                        },
                      ],
                    },
                  ],
                },
                {
                  name: t`Economy + Infrastructure`,
                  children: [
                    {
                      name: t`Innovation + Research`,
                      children: [
                        {
                          name: t`Investment, Growth and Commercialization`,
                          amount: 4.35,
                        },
                        {
                          name: t`Research`,
                          amount: 4.11,
                        },
                        {
                          name: t`Statistics Canada`,
                          amount: 0.74,
                        },
                        {
                          name: t`Other Boards + Councils`,
                          amount: 0.18,
                        },
                      ],
                    },
                    {
                      name: t`Community and Regional Development`,
                      children: [
                        {
                          name: t`Economic Development in Southern Ontario`,
                          amount: 0.46,
                        },
                        {
                          name: t`Economic Development in Atlantic Canada`,
                          amount: 0.39,
                        },
                        {
                          name: t`Economic Development in the Pacific Region`,
                          amount: 0.19,
                        },
                        {
                          name: t`Western + Northern Economic Development`,
                          amount: 1.09,
                        },
                        {
                          name: t`Economic Development in Northern Ontario`,
                          amount: 0.07,
                        },
                        {
                          name: t`Economic Development in Quebec`,
                          amount: 0.39,
                        },
                      ],
                    },
                    {
                      name: t`Fisheries`,
                      children: [
                        {
                          name: t`Coastguard Operations`,
                          amount: 1.8,
                        },
                        {
                          name: t`Fisheries + Aquatic Ecosystems`,
                          amount: 1.78,
                        },
                        {
                          name: t`Other Fisheries Expenses`,
                          amount: 0.97,
                        },
                      ],
                    },
                    {
                      name: t`Agriculture`,
                      amount: 4.19,
                    },
                    {
                      name: t`Space`,
                      amount: 0.45,
                    },
                    {
                      name: t`Banking + Finance`,
                      amount: 0.23,
                    },
                    {
                      name: t`Environment and Climate Change`,
                      children: [
                        {
                          name: t`Other Environment and Climate Change Programs`,
                          amount: 1.46,
                        },
                        {
                          name: t`Weather Services`,
                          amount: 0.28,
                        },
                        {
                          name: t`Nature Conservation`,
                          amount: 0.72,
                        },
                        {
                          name: t`National Parks`,
                          amount: 1.45,
                        },
                      ],
                    },
                    {
                      name: t`Natural Resources Management`,
                      children: [
                        {
                          name: t`Innovative and Sustainable Natural Resources Development`,
                          amount: 1.911,
                        },
                        {
                          name: t`Support for Global Competition`,
                          amount: 0.874,
                        },
                        {
                          name: t`Nuclear Labs + Decommissioning`,
                          amount: 1.514,
                        },
                        {
                          name: t`Natural Resources Science + Risk Mitigation`,
                          amount: 0.452,
                        },
                        {
                          name: t`Other Natural Resources Management Support`,
                          amount: 0.344,
                        },
                      ],
                    },
                    {
                      name: t`Infrastructure Investments`,
                      amount: 9.02,
                    },
                    {
                      name: t`Transportation`,
                      amount: 5.31,
                    },
                  ],
                },
              ],
            },
            {
              name: t`Social Security`,
              children: [
                {
                  name: t`Retirement Benefits`,
                  amount: 76.03,
                },
                {
                  name: t`Employment Insurance`,
                  amount: 23.13,
                },
                {
                  name: t`Children's Benefits`,
                  amount: 26.34,
                },
                {
                  name: t`COVID-19 Income Support`,
                  amount: -4.84,
                },
                {
                  name: t`Canada Emergency Wage Subsidy`,
                  amount: -0.42,
                },
              ],
            },
            {
              name: t`Safety`,
              children: [
                {
                  name: t`Public Safety`,
                  children: [
                    {
                      name: t`CSIS`,
                      amount: 0.83,
                    },
                    {
                      name: t`Corrections`,
                      amount: 3.374,
                    },
                    {
                      name: t`RCMP`,
                      amount: 5.14,
                    },
                    {
                      name: t`Disaster Relief`,
                      amount: 0.52,
                    },
                    {
                      name: t`Community Safety`,
                      amount: 0.839,
                    },
                    {
                      name: t`Office of the Chief Electoral Officer`,
                      amount: 0.249,
                    },
                    {
                      name: t`Other Public Safety Expenses`,
                      amount: 0.269,
                    },
                    {
                      name: t`Justice System`,
                      amount: 2.442,
                    },
                  ],
                },
                {
                  name: t`Immigration + Border Security`,
                  children: [
                    {
                      name: t`Border Security`,
                      amount: 2.69,
                    },
                    {
                      name: t`Other Immigration Services`,
                      amount: 3.389,
                    },
                    {
                      name: t`Settlement Assistance`,
                      amount: 1.926,
                    },
                    {
                      name: t`Interim Housing Assistance`,
                      amount: 0.26,
                    },
                    {
                      name: t`Visitors, International Students + Temporary Workers`,
                      amount: 0.52,
                    },
                    {
                      name: t`Citizenship + Passports`,
                      amount: 0.24,
                    },
                  ],
                },
              ],
            },
            {
              name: t`Other`,
              children: [
                {
                  name: t`Public Works + Government Services`,
                  children: [
                    {
                      name: t`Other Public Services + Procurement`,
                      amount: 5.388,
                    },
                    {
                      name: t`Government IT Operations`,
                      amount: 2.7,
                    },
                  ],
                },
                {
                  name: t`Functioning of Government`,
                  children: [
                    {
                      name: t`Parliament`,
                      amount: 0.93,
                    },
                    {
                      name: t`Privy Council Office`,
                      amount: 0.347,
                    },
                    {
                      name: t`Treasury Board`,
                      amount: 4.954,
                    },
                    {
                      name: t`Office of the Secretary to the Governor General`,
                      amount: 0.026,
                    },
                  ],
                },
                {
                  name: t`Net actuarial losses`,
                  amount: -7.49,
                },
              ],
            },
            {
              name: t`Transfers to Provinces`,
              link: "https://www.canada.ca/en/department-finance/programs/federal-transfers/major-federal-transfers.html",
              children: [
                {
                  name: t`Health Transfer to Provinces`,
                  children: [
                    {
                      name: t`Newfoundland and Labrador HTP`,
                      amount: 0.666,
                    },
                    {
                      name: t`Prince Edward Island HTP`,
                      amount: 0.214,
                    },
                    {
                      name: t`Nova Scotia HTP`,
                      amount: 1.303,
                    },
                    {
                      name: t`New Brunswick HTP`,
                      amount: 1.027,
                    },
                    {
                      name: t`Quebec HTP`,
                      amount: 10.911,
                    },
                    {
                      name: t`Ontario HTP`,
                      amount: 19.266,
                    },
                    {
                      name: t`Manitoba HTP`,
                      amount: 1.794,
                    },
                    {
                      name: t`Saskatchewan HTP`,
                      amount: 1.491,
                    },
                    {
                      name: t`Alberta HTP`,
                      amount: 5.771,
                    },
                    {
                      name: t`British Columbia HTP`,
                      amount: 6.817,
                    },
                    {
                      name: t`Yukon HTP`,
                      amount: 0.056,
                    },
                    {
                      name: t`Northwest Territories HTP`,
                      amount: 0.055,
                    },
                    {
                      name: t`Nunavut HTP`,
                      amount: 0.05,
                    },
                  ],
                },
                {
                  name: t`Social Transfer to Provinces`,
                  children: [
                    {
                      name: t`Newfoundland and Labrador STP`,
                      amount: 0.221,
                    },
                    {
                      name: t`Prince Edward Island STP`,
                      amount: 0.071,
                    },
                    {
                      name: t`Nova Scotia STP`,
                      amount: 0.433,
                    },
                    {
                      name: t`New Brunswick STP`,
                      amount: 0.341,
                    },
                    {
                      name: t`Quebec STP`,
                      amount: 3.624,
                    },
                    {
                      name: t`Ontario STP`,
                      amount: 6.4,
                    },
                    {
                      name: t`Manitoba STP`,
                      amount: 0.596,
                    },
                    {
                      name: t`Saskatchewan STP`,
                      amount: 0.495,
                    },
                    {
                      name: t`Alberta STP`,
                      amount: 1.917,
                    },
                    {
                      name: t`British Columbia STP`,
                      amount: 2.264,
                    },
                    {
                      name: t`Yukon STP`,
                      amount: 0.019,
                    },
                    {
                      name: t`Northwest Territories STP`,
                      amount: 0.018,
                    },
                    {
                      name: t`Nunavut STP`,
                      amount: 0.017,
                    },
                  ],
                },
                {
                  name: t`Equalization Payments to Provinces`,
                  children: [
                    {
                      name: t`Newfoundland and Labrador EQP`,
                      amount: 0,
                    },
                    {
                      name: t`Prince Edward Island EQP`,
                      amount: 0.561,
                    },
                    {
                      name: t`Nova Scotia EQP`,
                      amount: 2.803,
                    },
                    {
                      name: t`New Brunswick EQP`,
                      amount: 2.631,
                    },
                    {
                      name: t`Quebec EQP`,
                      amount: 14.037,
                    },
                    {
                      name: t`Ontario EQP`,
                      amount: 0.421,
                    },
                    {
                      name: t`Manitoba EQP`,
                      amount: 3.51,
                    },
                    {
                      name: t`Saskatchewan EQP`,
                      amount: 0,
                    },
                    {
                      name: t`Alberta EQP`,
                      amount: 0,
                    },
                    {
                      name: t`British Columbia EQP`,
                      amount: 0,
                    },
                    {
                      name: t`Yukon EQP`,
                      amount: 0,
                    },
                    {
                      name: t`Northwest Territories EQP`,
                      amount: 0,
                    },
                    {
                      name: t`Nunavut EQP`,
                      amount: 0,
                    },
                  ],
                },
                {
                  name: t`Quebec Tax Offset`,
                  amount: -7.1,
                },
                {
                  name: t`Other Major Transfers`,
                  amount: 17.6,
                },
              ],
            },
            {
              name: t`Obligations`,
              children: [
                {
                  name: t`Net Interest on Debt`,
                  amount: 47.27,
                },
              ],
            },
            {
              name: t`Defence`,
              children: [
                {
                  name: t`Ready Forces`,
                  amount: 13.368,
                },
                {
                  name: t`Defence Procurement`,
                  amount: 4.93,
                },
                {
                  name: t`Sustainable Bases, IT Systems, Infrastructure`,
                  amount: 4.913,
                },
                {
                  name: t`Defence Team`,
                  amount: 5.39,
                },
                {
                  name: t`Future Force Design`,
                  amount: 1.472,
                },
                {
                  name: t`Defence Operations + Internal Services`,
                  amount: 3.39,
                },
                {
                  name: t`Communications Security Establishment`,
                  amount: 1.01,
                },
                {
                  name: t`Other Defence`,
                  amount: 0.01,
                },
              ],
            },
            {
              name: t`Indigenous Priorities`,
              children: [
                {
                  name: t`Indigenous Well-Being + Self Determination`,
                  children: [
                    {
                      name: t`Grants to Support the New Fiscal Relationship with First Nations`,
                      amount: 1.36,
                    },
                    {
                      name: t`Community Infrastructure Grants`,
                      amount: 3.31,
                    },
                    {
                      name: t`First Nations Elementary and Secondary Educational Advancement`,
                      amount: 2.56,
                    },
                    {
                      name: t`On-reserve Income Support in Yukon Territory`,
                      amount: 1.4,
                    },
                    {
                      name: t`First Nations and Inuit Health Infrastructure Support`,
                      amount: 1.22,
                    },
                    {
                      name: t`Emergency Management Activities On-Reserve`,
                      amount: 0.59,
                    },
                    {
                      name: t`Prevention and Protection Services for Children, Youth, Families and Communities`,
                      amount: 3.57,
                    },
                    {
                      name: t`First Nations and Inuit Primary Health Care`,
                      amount: 3.03,
                    },
                    {
                      name: t`Other Support for Indigenous Well-Being`,
                      amount: 9.45,
                    },
                  ],
                },
                {
                  name: t`Crown-Indigenous Relations`,
                  children: [
                    {
                      name: t`Claims Settlements`,
                      children: [
                        {
                          name: t`Out of Court Settlement`,
                          amount: 5.0,
                        },
                        {
                          name: t`Gottfriedson Band Class Settlement`,
                          amount: 2.82,
                        },
                        {
                          name: t`Childhood Claims Settlement`,
                          amount: 1.42,
                        },
                        {
                          name: t`Other Settlement Agreements`,
                          amount: 0.85,
                        },
                      ],
                    },
                    {
                      name: t`Other Grants and Contributions to Support Crown-Indigenous Relations`,
                      amount: 6.26,
                    },
                  ],
                },
              ],
            },
            {
              name: t`International Affairs`,
              children: [
                {
                  name: t`Development, Peace + Security Programming`,
                  amount: 5.37,
                },
                {
                  name: t`International Diplomacy`,
                  amount: 1.0,
                },
                {
                  name: t`International Development Research Centre`,
                  amount: 0.16,
                },
                {
                  name: t`Support for Embassies + Canada's Presence Abroad`,
                  amount: 1.23,
                },
                {
                  name: t`Other International Affairs Activities`,
                  amount: 11.03,
                },
                {
                  name: t`Trade and Investment`,
                  amount: 0.41,
                },
              ],
            },
          ],
        },
        revenue_data: {
          name: t`Revenue`,
          children: [
            {
              name: t`Other Taxes and Duties`,
              children: [
                {
                  name: t`Goods and Services Tax`,
                  amount: 51.42,
                },
                {
                  name: t`Energy Taxes`,
                  children: [
                    {
                      name: t`Excise Tax — Gasoline`,
                      amount: 4.33,
                    },
                    {
                      name: t`Excise Tax - Diesel Fuel`,
                      amount: 1.12,
                    },
                    {
                      name: t`Excise Tax — Aviation Gasoline and Jet Fuel`,
                      amount: 0.14,
                    },
                  ],
                },
                {
                  name: t`Customs Duties`,
                  amount: 5.57,
                },
                {
                  name: t`Other Excise Taxes and Duties`,
                  children: [
                    {
                      name: t`Excise Duties`,
                      amount: 5.33,
                    },
                    {
                      name: t`Air Travellers Charge`,
                      amount: 1.5,
                    },
                  ],
                },
              ],
            },
            {
              name: t`Individual Income Taxes`,
              amount: 217.7,
            },
            {
              name: t`Corporate Income Taxes`,
              amount: 82.47,
            },
            {
              name: t`Non-resident Income Taxes`,
              amount: 12.54,
            },

            {
              name: t`Payroll Taxes`,
              children: [
                {
                  name: t`Employment Insurance Premiums`,
                  amount: 29.56,
                },
              ],
            },
            {
              name: t`Carbon Taxes`,
              amount: 10.5,
            },
            {
              name: t`Other Non-tax Revenue`,
              children: [
                {
                  name: t`Crown Corporations and other government business enterprises`,
                  amount: 3.22,
                },
                {
                  name: t`Net Foreign Exchange Revenue`,
                  amount: 3.4,
                },
                {
                  name: t`Return on Investments`,
                  amount: 0.88,
                },
                {
                  name: t`Sales of Government Goods + Services`,
                  amount: 13.99,
                },
                {
                  name: t`Miscellaneous revenues`,
                  amount: 15.87,
                },
              ],
            },
          ],
        },
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SankeyChart data={data as SankeyData} showDepartmentLinks={true} />;
}
