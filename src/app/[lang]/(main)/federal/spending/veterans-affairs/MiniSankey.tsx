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
        spending: 6.1,
        spending_data: {
          name: t`Veterans Affairs`,
          children: [
            {
              name: t`Personnel`,
              amount: 0.423984,
            },
            {
              name: t`Transportation + Communication`,
              amount: 0.037427,
            },
            {
              name: t`Information`,
              amount: 0.007986,
            },
            {
              name: t`Professional + Special Services`,
              amount: 0.584234,
            },
            {
              name: t`Rentals`,
              amount: 0.026549,
            },
            {
              name: t`Repair + Maintenance`,
              amount: 0.005666,
            },
            {
              name: t`Utilities, Materials and Supplies`,
              amount: 0.340309,
            },
            {
              name: t`Acquisition of Land, Buildings and Works`,
              amount: 0.001577,
            },
            {
              name: t`Acquisition of Machinery and Equipment`,
              amount: 0.005062,
            },
            {
              name: t`Transfer Payments`,
              amount: 4.636714,
            },
            {
              name: t`Public Debt Charges`,
              amount: 0,
            },
            {
              name: t`Other subsidies and payments`,
              amount: 0.001682,
            },
          ],
        },
        revenue_data: {},
      }),
    );
  }, [t]);

  return (
    <div className="sankey-chart-container spending-only">
      <SankeyChart data={data as SankeyData} />
    </div>
  );
}
