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
        spending: 10.2,
        spending_data: {
          name: t`Innovation, Science and Industry`,
          children: [
            {
              name: t`Personnel`,
              amount: 2.407587,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.056864,
            },
            {
              name: t`Information`,
              amount: 0.034491,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.57466,
            },
            {
              name: t`Rentals`,
              amount: 0.095712,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.046201,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.053107,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.033147,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.126316,
            },
            {
              name: t`Transfer Payments`,
              amount: 7.068773,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.178779,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0,
            },
            {
              name: t`External Revenues`,
              amount: -0.312511,
            },
            {
              name: t`Internal Revenues`,
              amount: -0.144659,
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
