"use client";

import { BarList } from "@/components/BarList";
import { useInflationScale } from "@/components/InflationContext";
import { formatNumber } from "@/components/Sankey/utils";

/**
 * Client wrapper around BarList that formats values (given in billions of CAD)
 * as compact currency. Used for the federal ministry list and department
 * spending-by-entity list. Kept as a client island so the value formatter is
 * not passed across the server/client boundary. Applies the real-dollar (CPI)
 * scaling when the inflation toggle is active (bar proportions are unchanged
 * since all values scale by the same factor).
 */
export function BillionsBarList({
  items,
}: {
  items: Array<{ name: string; value: number; href?: string; key?: string }>;
}) {
  const scale = useInflationScale();
  const scaled =
    scale === 1
      ? items
      : items.map((item) => ({ ...item, value: item.value * scale }));
  return (
    <BarList
      data={scaled}
      valueFormatter={(value: number) => formatNumber(value, 1e9)}
    />
  );
}
