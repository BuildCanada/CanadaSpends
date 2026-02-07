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
        spending: 63014.246,
        spending_data: {
          name: t`ISC and CIRNAC`,
          children: [
            {
              name: t`Personnel`,
              amount: 1.267608,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.555086,
            },
            {
              name: t`Information`,
              amount: 0.011969,
            },
            {
              name: t`Professional + Special Services`,
              amount: 1.627655,
            },
            {
              name: t`Rentals`,
              amount: 0.023349,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.009626,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.702127,
            },
            {
              name: t`Acquisition of Lands, Buildings and Works`,
              amount: 0.0002,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.077538,
            },
            {
              name: t`Transfer Payments`,
              amount: 25.946705,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 32.806918,
            },
            {
              name: t`External Revenues`,
              amount: -0.00598,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.0085547,
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
