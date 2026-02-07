"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Office of Infrastructure of Canada", value: 7.619725 },
  { name: "Canada Mortgage and Housing Corporation", value: 5.430271 },
  { name: "Windsor-Detroit Bridge Authority", value: 1.289463 },
  { name: "The Jacques-Cartier and Champlain Bridges Inc", value: 0.156303 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
