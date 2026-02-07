"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

// Data from TAB 44
const data = [
  { name: "Department of Citizenship and Immigration", value: 5.994256 },
  { name: "Immigration and Refugee Board", value: 0.341256 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
