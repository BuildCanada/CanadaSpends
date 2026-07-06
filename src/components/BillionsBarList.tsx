"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

/**
 * Client wrapper around BarList that formats values (given in billions of CAD)
 * as compact currency. Used for the federal ministry list and department
 * spending-by-entity list. Kept as a client island so the value formatter is
 * not passed across the server/client boundary.
 */
export function BillionsBarList({
  items,
}: {
  items: Array<{ name: string; value: number; href?: string; key?: string }>;
}) {
  return (
    <BarList
      data={items}
      valueFormatter={(value: number) => formatNumber(value, 1e9)}
    />
  );
}
