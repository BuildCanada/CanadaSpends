"use client";

import { BarChart } from "@/components/BarChart";

/**
 * Client wrapper rendering one TBS workforce demographics dimension (age
 * bands, tenure, salary ranges) as a bar chart. Band labels arrive already
 * localized (label_en/label_fr chosen server-side); `seriesLabel` names the
 * series in tooltips. Kept as a client island so the compact-number formatter
 * is not passed across the server/client boundary.
 */
export function WorkforceBandChart({
  data,
  seriesLabel,
}: {
  data: Array<{ name: string; value: number }>;
  seriesLabel: string;
}) {
  const rows = data.map((d) => ({ name: d.name, [seriesLabel]: d.value }));
  return (
    <BarChart
      className="h-48"
      data={rows}
      index="name"
      categories={[seriesLabel]}
      showLegend={false}
      showGridLines={false}
      valueFormatter={(value) =>
        Intl.NumberFormat("en-US", { notation: "compact" }).format(
          Number(value),
        )
      }
    />
  );
}
