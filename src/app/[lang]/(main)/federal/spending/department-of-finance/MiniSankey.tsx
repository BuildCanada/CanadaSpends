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
        spending: 136.1,
        spending_data: {
          name: t`Department of Finance`,
          children: [
            {
              name: t`Canada health transfer`,
              amount: 51.43,
            },
            {
              name: t`Canada social transfer`,
              amount: 16.42,
            },
            {
              name: t`Fiscal arrangements`,
              amount: 29.42,
            },
            {
              name: t`Quebec abatement`,
              amount: -7.1,
            },
            {
              name: t`Other`,
              amount: 1.0,
            },
            {
              name: t`Other expenditures`,
              amount: 2.47,
            },
            {
              name: t`Public debt charges`,
              amount: 42.47,
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
