"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Department of Health", value: 6.842293 },
  { name: "Public Health Agency of Canada", value: 4.428531 },
  { name: "Canadian Institutes of Health Research", value: 1.348456 },
  { name: "Canadian Food Inspection Agency", value: 1.079322 },
  { name: "Patented Medicine Prices Review Board", value: 0.000014044 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
