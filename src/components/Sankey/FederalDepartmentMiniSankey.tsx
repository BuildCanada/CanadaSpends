"use client";

import { useInflationScale } from "@/components/InflationContext";
import type { FederalSankeyNode } from "@/lib/federal";
import { useMemo } from "react";
import { SankeyChart } from "./SankeyChart";
import { SankeyData } from "./SankeyChartD3";

function sumNode(node: FederalSankeyNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((acc, c) => acc + sumNode(c), 0);
  }
  return typeof node.amount === "number" ? node.amount : 0;
}

// Amounts live on leaves only (parents carry no amount).
function scaleNode(node: FederalSankeyNode, factor: number): FederalSankeyNode {
  if (node.children && node.children.length) {
    return {
      ...node,
      children: node.children.map((c) => scaleNode(c, factor)),
    };
  }
  return {
    ...node,
    amount: typeof node.amount === "number" ? node.amount * factor : 0,
  };
}

/**
 * Spending-only mini Sankey for a federal department page, fed directly from
 * departments/{slug}.json `miniSankey.spending_data` (a top-N + "Other" tree).
 * Mirrors the provincial DepartmentMiniSankey but keeps the pre-built tree
 * (including its stable ids and already-translated names) intact. Applies the
 * real-dollar (CPI) scaling when the inflation toggle is active.
 */
export function FederalDepartmentMiniSankey({
  spendingData,
}: {
  spendingData: FederalSankeyNode;
}) {
  const scale = useInflationScale();
  const data = useMemo(() => {
    const tree = scale === 1 ? spendingData : scaleNode(spendingData, scale);
    const total = sumNode(tree);
    return {
      total,
      spending: total,
      revenue: 0,
      spending_data: tree,
      revenue_data: {
        id: `${spendingData.id ?? "dept"}-revenue-root`,
        name: "Revenue",
        amount: 0,
        children: [],
      },
    } as unknown as SankeyData;
  }, [spendingData, scale]);

  return (
    <div className="sankey-chart-container spending-only">
      <SankeyChart data={data} />
    </div>
  );
}
