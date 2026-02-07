"use client";

import { SankeyChart } from "@/components/Sankey/SankeyChart";
import type { SankeyData } from "@/components/Sankey/SankeyChartD3";
import { useLingui } from "@lingui/react/macro";
import { useMemo } from "react";

export function MiniSankey() {
  const { t } = useLingui();

  const data = useMemo(() => {
    return JSON.parse(
      JSON.stringify({
        spending: 97.282,
        spending_data: {
          name: t`ESDC`,
          children: [
            {
              name: t`Personnel`,
              amount: 4.013769,
            },
            {
              name: t`Transportation and Communication`,
              amount: 0.087711,
            },
            {
              name: t`Information`,
              amount: 0.095566,
            },
            {
              name: t`Professional and Special Services`,
              amount: 1.021141,
            },
            {
              name: t`Rentals`,
              amount: 0.312904,
            },
            {
              name: t`Repair and Maintenance`,
              amount: 0.002714,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.004768,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.047273,
            },
            {
              name: t`Transfer Payments`,
              amount: 91.50417,
            },
            {
              name: t`Other Subsidies and Payments`,
              amount: 0.192769,
            },
            {
              name: t`External Revenues`,
              amount: -0.55039,
            },
            {
              name: t`Internal Revenues`,
              amount: -2.252413,
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
