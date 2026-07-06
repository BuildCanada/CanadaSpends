"use client";

import { useInflationScale } from "@/components/InflationContext";
import { useMemo } from "react";
import { SankeyChart } from "./SankeyChart";
import { SankeyData, SankeyNode } from "./SankeyChartD3";

// Amounts live on leaves only (parents carry no amount — the chart sums
// leaves); scaling therefore multiplies leaf amounts and the declared totals.
function scaleNode(node: SankeyNode, factor: number): SankeyNode {
  if (node.children && node.children.length) {
    return {
      ...node,
      children: node.children.map((c) => scaleNode(c, factor)),
    };
  }
  return { ...node, amount: (node.amount || 0) * factor };
}

/**
 * Client boundary around the full revenue/spending SankeyChart for the federal
 * data-driven pages. SankeyChart itself has no "use client" directive (it is
 * only ever reached through a client wrapper), so server components must import
 * it via a wrapper like this one. Applies the real-dollar (CPI) scaling when
 * the inflation toggle is active.
 */
export function FederalSankey({ data }: { data: SankeyData }) {
  const scale = useInflationScale();
  const scaled = useMemo(() => {
    if (scale === 1) return data;
    return {
      ...data,
      total: data.total * scale,
      spending: data.spending * scale,
      revenue: data.revenue * scale,
      spending_data: scaleNode(data.spending_data, scale),
      revenue_data: scaleNode(data.revenue_data, scale),
    };
  }, [data, scale]);
  return <SankeyChart data={scaled} />;
}
