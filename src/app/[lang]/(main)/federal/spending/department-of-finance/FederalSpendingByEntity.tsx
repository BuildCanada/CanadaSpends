"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Department of Finance", value: 1.355 },
  { name: "Financial Consumer Agency of Canada", value: 0.053 },
  {
    name: "Financial Transactions and Reports Analysis Centre of Canada",
    value: 0.098,
  },
  { name: "Office of the Auditor General", value: 0.134 },
  {
    name: "Office of the Superintendent of Financial Institutions",
    value: 0.311,
  },
];

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
