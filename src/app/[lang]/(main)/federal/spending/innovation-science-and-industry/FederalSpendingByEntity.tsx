"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

// Data from TAB 41
const data = [
  { name: "Department of Industry", value: 4.348247 },
  { name: "Canada Space Agency", value: 0.450747 },
  { name: "Canadian Tourism Commission", value: 0.122662 },
  { name: "Copyright Board", value: 0.004075 },
  {
    name: "Federal Economic Development Agency for Southern Ontario",
    value: 0.462032,
  },
  { name: "National Research Council of Canada", value: 1.525981 },
  {
    name: "Natural Sciences and Engineering Research Council",
    value: 1.383259,
  },
  { name: "Social Sciences and Humanities Research Council", value: 1.160335 },
  { name: "Standards Council of Canada", value: 0.02042 },
  { name: "Statistics Canada", value: 0.740709 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
