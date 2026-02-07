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
        spending: 5.1,
        spending_data: {
          name: t`Transport Canada`,
          children: [
            {
              name: t`Personnel`,
              amount: 0.921121,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.029554,
            },
            {
              name: t`Information`,
              amount: 0.011927,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.277502,
            },
            {
              name: t`Rentals`,
              amount: 0.025239,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.022232,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.017928,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.116258,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.070631,
            },
            {
              name: t`Transfer Payments`,
              amount: 1.652903,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 2.050805,
            },
            {
              name: t`External Revenues`,
              amount: -0.046939,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.051295,
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
