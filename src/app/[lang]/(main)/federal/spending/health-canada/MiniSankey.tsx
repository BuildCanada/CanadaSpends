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
        spending: 13.64,
        spending_data: {
          name: t`Health Canada`,
          children: [
            {
              name: t`Personnel`,
              amount: 2.636333,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.034712,
            },
            {
              name: t`Information`,
              amount: 0.093827,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.774417,
            },
            {
              name: t`Rentals`,
              amount: 0.063698,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.040553,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 3.038712,
            },
            {
              name: t`Acquisition of Lands, Buildings and Works`,
              amount: 0.000001072,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.000093304,
            },
            {
              name: t`Transfer Payments`,
              amount: 7.175537,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.000004913,
            },
            {
              name: t`External Revenues`,
              amount: -0.213425,
            },
            {
              name: t`Internal Revenues`,
              amount: 0.000031007,
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
