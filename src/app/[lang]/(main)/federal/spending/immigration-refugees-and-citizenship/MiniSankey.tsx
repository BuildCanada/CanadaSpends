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
        spending: 6.3,
        spending_data: {
          name: t`Immigration, Refugees and Citizenship`,
          children: [
            {
              name: t`Personnel`,
              amount: 1.655261,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.083547,
            },
            {
              name: t`Information`,
              amount: 0.013223,
            },
            {
              name: t`Professional + Special Services`,
              amount: 1.669685,
            },
            {
              name: t`Rentals`,
              amount: 0.442464,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.002575,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.043101,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.002545,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.021627,
            },
            {
              name: t`Transfer Payments`,
              amount: 2.993638,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.024085,
            },
            {
              name: t`External Revenues`,
              amount: -0.613454,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.002785,
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
