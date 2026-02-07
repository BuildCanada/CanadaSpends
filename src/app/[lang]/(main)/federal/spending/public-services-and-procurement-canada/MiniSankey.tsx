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
        spending: 8.3,
        spending_data: {
          name: t`Public Services and Procurement Canada`,
          children: [
            {
              name: t`Personnel`,
              amount: 3.318286,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.711299,
            },
            {
              name: t`Information`,
              amount: 0.021606,
            },
            {
              name: t`Professional + Special Services`,
              amount: 3.051013,
            },
            {
              name: t`Rentals`,
              amount: 1.96169,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 1.613194,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.116031,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 1.281844,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.545773,
            },
            {
              name: t`Transfer Payments`,
              amount: 0.051293,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0.107187,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.546409,
            },
            {
              name: t`External Revenues`,
              amount: -0.265103,
            },
            {
              name: t`Internal Revenues`,
              amount: -4.77534,
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
