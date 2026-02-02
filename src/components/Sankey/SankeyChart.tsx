import { hierarchy } from "d3";
import { useCallback, useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useLingui } from "@lingui/react/macro";
/* @ts-ignore CSS exports no types */
import "./SankeyChart.css";
import { SankeyData } from "./SankeyChartD3";
import { SankeyChartSingle } from "./SankeyChartSingle";
import { formatNumber, sortNodesByAmount, transformToIdBased } from "./utils";
import {
  departmentNames,
  nodeToDepartment,
} from "@/lib/sankeyDepartmentMappings";
import { colours } from "@/styles/colours";

// Dynamically import React Select to avoid SSR hydration issues
const Select = dynamic(() => import("react-select"), {
  ssr: false,
  loading: () => <div className="search-select-placeholder">Loading...</div>,
}) as any;

type FlatDataNodes = ReturnType<typeof getFlatData>["nodes"];
type Node = FlatDataNodes[number] & {
  realValue?: number;
};

interface HoverNodeType extends Node {
  percent: number;
  overallPercent?: number;
  blockRect?: DOMRect;
  departmentSlug?: string;
}

interface SearchOptionType {
  value: string;
  label: string;
}

const getFlatData = (data: SankeyData) => {
  const revenueRoot = hierarchy(data.revenue_data).sum((d) => {
    return d.amount;
  });

  const spendingRoot = hierarchy(data.spending_data).sum((d) => {
    return d.amount;
  });

  return {
    nodes: [
      ...revenueRoot.descendants().map((d) => ({
        ...d.data,
        parent: d.parent?.data.id,
        value: d.value,
        type: "revenue",
      })),
      ...spendingRoot.descendants().map((d) => ({
        ...d.data,
        parent: d.parent?.data.id,
        value: d.value,
        type: "spending",
      })),
    ].sort((a, b) => {
      return (a.displayName || a.name || "").localeCompare(
        b.displayName || b.name || "",
      );
    }),
    revenueTotal: revenueRoot.value ?? 0,
    spendingTotal: spendingRoot.value ?? 0,
  };
};

const chartHeight = 760;
const DEFAULT_AMOUNT_SCALING_FACTOR = 1e9;

const chartConfig = {
  revenue: {
    id: "revenue-chart-root",
    colors: {
      primary: colours.lake[700],
    },
    direction: "right-to-left",
    differenceLabel: "Deficit",
  },
  spending: {
    id: "spending-chart-root",
    colors: {
      primary: colours.auburn[800],
    },
    direction: "left-to-right",
    differenceLabel: "Surplus",
  },
} as const;

// showDepartmentLinks: explicit opt-in so only contexts that want department
// pages (currently the federal chart) render the "Learn more" links. Default
// is false to avoid showing federal department links on provincial/municipal
// charts where node labels map to local ministries/programs (which could be
// incorrect or lead to broken navigation). Callers should pass
// `showDepartmentLinks={true}` to enable links for that context.
export type SankeyChartProps = {
  data: SankeyData;
  showDepartmentLinks?: boolean;
  // Scaling factor for amounts. Use 1e9 (default) for data in billions,
  // 1e6 for millions, or 1 for raw values (no scaling).
  amountScalingFactor?: number;
};

export function SankeyChart(props: SankeyChartProps) {
  const { amountScalingFactor = DEFAULT_AMOUNT_SCALING_FACTOR } = props;
  const { i18n } = useLingui();
  const [chartData, setChartData] = useState<SankeyData | null>(null);
  const [flatData, setFlatData] = useState<FlatDataNodes | null>(null);

  const [searchedNode, setSearchedNode] = useState<SearchOptionType | null>(
    null,
  );
  const [searchResult, setSearchResult] = useState<Node | null>(null);
  const [hoverNode, setHoverNode] = useState<HoverNodeType | null>(null);
  // Mouse position as fallback - ensures tooltip still works if blockRect is missing
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Transform the data to use ID-based structure
    const transformedData = {
      ...props.data,
      revenue_data: transformToIdBased(props.data.revenue_data),
      spending_data: transformToIdBased(props.data.spending_data),
    };

    setChartData(transformedData);
    const { nodes, revenueTotal, spendingTotal } = getFlatData(transformedData);

    setFlatData(nodes);
    setTotalAmount(Math.max(revenueTotal, spendingTotal));
  }, [props.data]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTooltipTimeoutRef.current) {
        clearTimeout(hideTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (selected: SearchOptionType | null) => {
    setSearchedNode(selected);

    if (!selected) {
      return setSearchResult(null);
    }

    let node = flatData?.find((d) => d.id === selected.value);

    // If it's a leaf node, we need to find the parent node
    if (!node?.children) {
      node = flatData?.find((d) => d.id === node?.parent);
    }

    setSearchResult(node ?? null);
  };

  const handleMouseOver = useCallback(
    (totalAmount: number, overallTotalAmount?: number) => {
      return (node: Node, event?: MouseEvent) => {
        // Clear any pending hide timeout
        if (hideTooltipTimeoutRef.current) {
          clearTimeout(hideTooltipTimeoutRef.current);
          hideTooltipTimeoutRef.current = null;
        }
        const percent = (node.realValue! / totalAmount) * 100;
        const overallPercent = overallTotalAmount
          ? (node.realValue! / overallTotalAmount) * 100
          : undefined;
        setHoverNode({
          ...node,
          percent,
          overallPercent,
        });
        // Store mouse position as fallback for tooltip positioning
        if (event) {
          setMousePosition({ x: event.clientX, y: event.clientY });
        }
      };
    },
    [],
  );

  const handleMouseOut = useCallback(() => {
    hideTooltipTimeoutRef.current = setTimeout(() => {
      setHoverNode(null);
      setMousePosition(null);
    }, 100);
  }, []);

  return (
    <div className="sankey-chart-wrapper">
      <div className="sankey-chart-header">
        <div className="search-container">
          <Select
            instanceId="sankey-search"
            inputId="sankey-search-input"
            value={searchedNode}
            options={flatData
              ?.flatMap((d) => {
                const base = {
                  value: d.id!,
                  label: d.displayName || d.name || "Unknown",
                };

                const deptSlug = nodeToDepartment[d.displayName];
                if (deptSlug && departmentNames[deptSlug] && d.children) {
                  return [
                    base,
                    {
                      value: d.id!,
                      label: departmentNames[deptSlug],
                    },
                  ];
                }
                return [base];
              })
              .filter((d) => d.value && d.label)}
            onChange={handleSearch}
            isClearable={true}
            placeholder="Search..."
            className="search-select"
            styles={{
              input: (base: any) => ({
                ...base,
                color: "#f6ebe3",
              }),
              singleValue: (base: any) => ({
                ...base,
                color: "#f6ebe3",
              }),
              control: (base: any) => ({
                ...base,
                color: "#f6ebe3",
                backgroundColor: "#272727",
                borderColor: "#A8A19B",
              }),
            }}
          />
        </div>
      </div>

      <div className="sankey-chart-content">
        {hoverNode && (
          <div
            className="node-tooltip"
            onMouseEnter={() => {
              if (hideTooltipTimeoutRef.current) {
                clearTimeout(hideTooltipTimeoutRef.current);
                hideTooltipTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleMouseOut}
            style={{
              // Horizontal: right of the block, constrained to viewport
              left: hoverNode.blockRect
                ? `${Math.min(hoverNode.blockRect.right + 10, window.innerWidth - 340)}px`
                : `${Math.min((mousePosition?.x || 0) + 10, window.innerWidth - 340)}px`,
              // Vertical: 40px above the block to avoid native tooltip conflict
              // Math.max ensures tooltip stays within viewport (min 10px from top)
              top: hoverNode.blockRect
                ? `${Math.max(10, hoverNode.blockRect.top - 40)}px`
                : `${(mousePosition?.y || 0) + 10}px`,
            }}
          >
            <p className="node-tooltip-name">
              {hoverNode.displayName || hoverNode.name}
            </p>
            <div className="node-tooltip-amount">
              <span>
                {formatNumber(hoverNode.realValue ?? 0, amountScalingFactor)}
              </span>
              <span className="node-tooltip-amount-divider">&#8226;</span>
              <div className="node-tooltip-percentage">
                <span>{hoverNode.percent.toFixed(1)}%</span>
                {hoverNode.overallPercent !== undefined && (
                  <div className="node-tooltip-overall">
                    {hoverNode.overallPercent.toFixed(1)}% of total
                  </div>
                )}
              </div>
            </div>
            {hoverNode.departmentSlug && props.showDepartmentLinks && (
              <div className="node-tooltip-department">
                <a
                  href={`/${i18n.locale}/federal/spending/${hoverNode.departmentSlug}`}
                  className="node-tooltip-link"
                >
                  Learn more
                </a>
              </div>
            )}
          </div>
        )}

        {chartData && !searchResult && (
          <div className="charts">
            <SankeyChartSingle
              {...chartConfig.revenue}
              data={sortNodesByAmount(chartData.revenue_data)}
              totalAmount={totalAmount}
              difference={
                chartData.spending > chartData.revenue
                  ? chartData.spending - chartData.revenue // deficit
                  : 0
              }
              height={chartHeight}
              amountScalingFactor={amountScalingFactor}
              onMouseOver={handleMouseOver(chartData.revenue)}
              onMouseOut={handleMouseOut}
            />
            <SankeyChartSingle
              {...chartConfig.spending}
              data={sortNodesByAmount(chartData.spending_data)}
              totalAmount={totalAmount}
              difference={
                chartData.revenue > chartData.spending
                  ? chartData.revenue - chartData.spending // surplus
                  : 0
              }
              height={chartHeight}
              amountScalingFactor={amountScalingFactor}
              onMouseOver={handleMouseOver(chartData.spending)}
              onMouseOut={handleMouseOut}
            />
          </div>
        )}

        {searchResult && (
          <div className="chart search-results">
            <SankeyChartSingle
              id="search-results-root"
              data={searchResult}
              // @ts-expect-error: fix type here
              colors={chartConfig[searchResult.type].colors}
              // @ts-expect-error: fix type here
              direction={chartConfig[searchResult.type].direction}
              totalAmount={searchResult.value ?? 0}
              height={chartHeight}
              amountScalingFactor={amountScalingFactor}
              difference={0}
              differenceLabel=""
              onMouseOver={handleMouseOver(
                searchResult.value ?? 0,
                // @ts-expect-error: fix type here
                chartData?.[searchResult.type],
              )}
              onMouseOut={handleMouseOut}
            />
          </div>
        )}
      </div>
    </div>
  );
}
