"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Department of Indigenous Services", value: 46.48 },
  {
    name: "Department of Crown-Indigenous Relations and Northern Affairs",
    value: 16.35,
  },
  {
    name: "Federal Economic Development Agency for Northern Ontario",
    value: 0.07,
  },
  { name: "Canadian High Arctic Research Station", value: 0.037 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
