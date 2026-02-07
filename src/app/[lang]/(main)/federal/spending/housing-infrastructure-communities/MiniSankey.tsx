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
        spending: 14.4957,
        spending_data: {
          name: t`HICC`,
          children: [
            {
              name: t`Personnel`,
              amount: 0.196302,
            },
            {
              name: t`Transportation and Communication`,
              amount: 0.001848,
            },
            {
              name: t`Information`,
              amount: 0.002996,
            },
            {
              name: t`Professional and Special Services`,
              amount: 0.044639,
            },
            {
              name: t`Rentals`,
              amount: 0.003267,
            },
            {
              name: t`Repair and Maintenance`,
              amount: 0.021414,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.000145,
            },
            {
              name: t`Acquisition of Lands, Buildings and Works`,
              amount: 0.007561,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.000725,
            },
            {
              name: t`Transfer Payments`,
              amount: 7.298586,
            },
            {
              name: t`Public debt charges`,
              amount: 0.042217,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 6.876062,
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
