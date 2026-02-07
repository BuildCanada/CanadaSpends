"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

// This is placeholder data - Replace with real data from TAB 38
const data = [
  {
    name: "Department of Public Works and Government Services",
    value: 5.375281,
  },
  { name: "Canada Post Corporation", value: 0.02221 },
  { name: "National Capital Commission", value: 0.096902 },
  { name: "Shared Services Canada", value: 2.790789 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
