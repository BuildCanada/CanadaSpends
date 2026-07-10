"use client";

import { LineChart } from "@/components/LineChart";

/**
 * Client wrapper rendering a department's historical share of federal spending
 * (percent, by fiscal year). Kept as a client island so the percent formatter
 * is not passed across the server/client boundary.
 */
export function HistoricalShareChart({
  data,
}: {
  data: Array<{ Year: string; Percentage: number }>;
}) {
  return (
    <LineChart
      data={data}
      index="Year"
      categories={["Percentage"]}
      showLegend={false}
      valueFormatter={(value: number) =>
        Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(value / 100)
      }
    />
  );
}
