"use client";

import { SankeyChart } from "./SankeyChart";
import { SankeyData } from "./SankeyChartD3";

/**
 * Client boundary around the full revenue/spending SankeyChart for the federal
 * data-driven pages. SankeyChart itself has no "use client" directive (it is
 * only ever reached through a client wrapper), so server components must import
 * it via a wrapper like this one.
 */
export function FederalSankey({ data }: { data: SankeyData }) {
  return <SankeyChart data={data} />;
}
