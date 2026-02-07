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
        spending: 34.49,
        spending_data: {
          name: t`Department of National Defence`,
          children: [
            {
              name: t`Personnel`,
              amount: 16.236306,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.923533,
            },
            {
              name: t`Information`,
              amount: 0.027551,
            },
            {
              name: t`Professional + Special Services`,
              amount: 5.602702,
            },
            {
              name: t`Rentals`,
              amount: 0.715791,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 2.002019,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 1.255881,
            },
            {
              name: t`Acquisition of Lands, Buildings and Works`,
              amount: 0.735367,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 5.071853,
            },
            {
              name: t`Transfer Payments`,
              amount: 1.125459,
            },
            {
              name: t`Public debt charges`,
              amount: 0.064426,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 1.087292,
            },
            {
              name: t`External Revenues`,
              amount: -0.324923,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.029588,
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
