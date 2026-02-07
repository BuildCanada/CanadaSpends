"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

// Data from TAB 50
const data = [
  { name: "Department of Transport", value: 3.019244 },
  { name: "Canadian Air Transport Security Authority", value: 0.971163 },
  { name: "Canadian Transportation Agency", value: 0.055276 },
  { name: "Marine Atlantic Inc.", value: 0.191685 },
  { name: "The Federal Bridge Corporation Limited", value: 0.007045 },
  { name: "VIA HFR - VIA TGF Inc", value: 0.049503 },
  { name: "VIA Rail Canada Inc", value: 0.80395 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
