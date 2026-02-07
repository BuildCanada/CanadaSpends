"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Department of Employment and Social Development", value: 94.4 },
  {
    name: "Canadian Accessibility Standards Development Organization",
    value: 0.021,
  },
  { name: "Canadian Centre for Occupational Health and Safety", value: 0.015 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
