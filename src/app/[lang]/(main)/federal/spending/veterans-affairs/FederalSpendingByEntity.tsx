"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

// Data from TAB 47
const data = [
  { name: "Department of Veterans Affairs", value: 6.053066 },
  { name: "Veterans Review and Appeal Board", value: 0.018124 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
