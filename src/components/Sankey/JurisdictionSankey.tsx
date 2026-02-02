"use client";
import { SankeyChart } from "./SankeyChart";
import { SankeyData } from "./SankeyChartD3";

export function JurisdictionSankey({
  data,
  amountScalingFactor,
}: {
  data: SankeyData;
  // Scaling factor for amounts. Use 1e9 (default) for data in billions,
  // 1e6 for millions, or 1 for raw values (no scaling).
  amountScalingFactor?: number;
  // Kept for backwards compatibility - not currently used
  jurisdictionSlug?: string;
}) {
  return <SankeyChart data={data} amountScalingFactor={amountScalingFactor} />;
}
