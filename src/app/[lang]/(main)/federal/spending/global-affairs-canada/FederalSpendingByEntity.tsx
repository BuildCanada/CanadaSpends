"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  {
    name: "Department of Foreign Affairs, Trade and Development",
    value: 8.458079,
  },
  { name: "Canadian Commercial Corporation", value: 0.013962 },
  { name: "Export Development Canada (Canada Account)", value: 10.522747 },
  { name: "International Development Research Centre", value: 0.164606 },
  {
    name: "International Joint Commission (Canadian Section)",
    value: 0.009192,
  },
  { name: "Invest in Canada Hub", value: 0.034272 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
