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
        spending: 19.2,
        spending_data: {
          name: t`Global Affairs Canada`,
          children: [
            {
              name: t`Personnel`,
              amount: 1.699961,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.156031,
            },
            {
              name: t`Information`,
              amount: 0.04401,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.606877,
            },
            {
              name: t`Rentals`,
              amount: 0.242551,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.028503,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.04754,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.032242,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.052845,
            },
            {
              name: t`Transfer Payments`,
              amount: 5.818928,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 10.528612,
            },
            {
              name: t`External Revenues`,
              amount: -0.054519,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.000723,
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
