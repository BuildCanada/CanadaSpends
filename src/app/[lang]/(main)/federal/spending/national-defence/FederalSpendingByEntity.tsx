"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Department of National Defence", value: 33.47 },
  { name: "Communications and Security Establishment", value: 1.01 },
  { name: "Military Grievances External Review Committee", value: 0.01 },
  { name: "Military Police Complaints Commission", value: 0.01 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
