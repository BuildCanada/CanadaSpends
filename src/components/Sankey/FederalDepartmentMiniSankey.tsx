"use client";

import type { FederalSankeyNode } from "@/lib/federal";
import { SankeyChart } from "./SankeyChart";
import { SankeyData } from "./SankeyChartD3";

function sumNode(node: FederalSankeyNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((acc, c) => acc + sumNode(c), 0);
  }
  return typeof node.amount === "number" ? node.amount : 0;
}

/**
 * Spending-only mini Sankey for a federal department page, fed directly from
 * departments/{slug}.json `miniSankey.spending_data` (a top-N + "Other" tree).
 * Mirrors the provincial DepartmentMiniSankey but keeps the pre-built tree
 * (including its stable ids and already-translated names) intact.
 */
export function FederalDepartmentMiniSankey({
  spendingData,
}: {
  spendingData: FederalSankeyNode;
}) {
  const total = sumNode(spendingData);

  const data: SankeyData = {
    total,
    spending: total,
    revenue: 0,
    spending_data: spendingData,
    revenue_data: {
      id: `${spendingData.id ?? "dept"}-revenue-root`,
      name: "Revenue",
      amount: 0,
      children: [],
    },
  } as unknown as SankeyData;

  return (
    <div className="sankey-chart-container spending-only">
      <SankeyChart data={data} />
    </div>
  );
}
