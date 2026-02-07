"use client";

import { SankeyChart } from "@/components/Sankey/SankeyChart";
import { SankeyData } from "@/components/Sankey/SankeyChartD3";
import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

export function MiniSankey() {
  const { t } = useLingui();

  const data = useMemo(() => {
    return JSON.parse(
      JSON.stringify({
        spending: 13.9,
        spending_data: {
          name: t`Public Safety Canada`,
          children: [
            {
              name: t`Personnel`,
              amount: 9.882296,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.349758,
            },
            {
              name: t`Information`,
              amount: 0.020448,
            },
            {
              name: t`Professional + Special Services`,
              amount: 1.857377,
            },
            {
              name: t`Rentals`,
              amount: 0.252258,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.207463,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.411159,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.292452,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.479816,
            },
            {
              name: t`Transfer Payments`,
              amount: 1.929606,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0.000548,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.531532,
            },
            {
              name: t`External Revenues`,
              amount: -2.171511,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.13135,
            },
          ],
        },
        revenue_data: {},
      }),
    );
  }, []);

  return (
    <div className="sankey-chart-container spending-only">
      <SankeyChart data={data as SankeyData} />
    </div>
  );
}
