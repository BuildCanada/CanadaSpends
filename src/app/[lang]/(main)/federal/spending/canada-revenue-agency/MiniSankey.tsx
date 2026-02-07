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
        spending: 16.8,
        spending_data: {
          name: t`Canada Revenue Agency`,
          children: [
            {
              name: t`Personnel`,
              amount: 5.895203,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.104201,
            },
            {
              name: t`Information`,
              amount: 0.02778,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.647165,
            },
            {
              name: t`Rentals`,
              amount: 0.303908,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.056688,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.015873,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.046147,
            },
            {
              name: t`Transfer Payments`,
              amount: 10.177964,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.018964,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.491963,
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
