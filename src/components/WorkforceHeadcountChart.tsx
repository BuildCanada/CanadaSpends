"use client";

import { LineChart } from "@/components/LineChart";

/**
 * Client wrapper rendering federal public service headcount over time (as of
 * March 31 each year). Kept as a client island so the compact-number formatter
 * is not passed across the server/client boundary (mirrors HistoricalShareChart).
 */
export function WorkforceHeadcountChart({
  data,
}: {
  data: Array<{ Year: string; Headcount: number }>;
}) {
  return (
    <LineChart
      className="h-56"
      data={data}
      index="Year"
      categories={["Headcount"]}
      showLegend={false}
      valueFormatter={(value: number) =>
        Intl.NumberFormat("en-US", { notation: "compact" }).format(value)
      }
    />
  );
}
