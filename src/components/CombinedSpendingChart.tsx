"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/format";
export interface CombinedSpendingItem {
  name: string;
  federalAmount: number;
  provincialAmount: number;
  totalAmount: number;
  formattedTotal: string;
}

interface CombinedSpendingChartProps {
  data: CombinedSpendingItem[];
  title?: string;
  totalAmount: number;
}

export function CombinedSpendingChart({
  data,
  title,
  totalAmount,
}: CombinedSpendingChartProps) {
  const maxAmount = Math.max(...data.map((item) => item.totalAmount));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-6">{title}</h3>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-chart-1" />
          <span className="text-sm font-medium text-foreground/70">
            Federal
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-chart-3" />
          <span className="text-sm font-medium text-foreground/70">
            Provincial
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const totalBarWidth = (item.totalAmount / maxAmount) * 100;
          const federalWidth =
            item.totalAmount > 0
              ? (item.federalAmount / item.totalAmount) * totalBarWidth
              : 0;
          const provincialWidth =
            item.totalAmount > 0
              ? (item.provincialAmount / item.totalAmount) * totalBarWidth
              : 0;
          const percentageOfTotalTax =
            totalAmount > 0 ? (item.totalAmount / totalAmount) * 100 : 0;
          return (
            <div key={item.name} className="space-y-2">
              {/* Category name and amount row */}
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-900 flex-1 pr-4">
                  {item.name}
                </div>
                <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {item.formattedTotal} ({percentageOfTotalTax.toFixed(1)}%)
                </div>
              </div>

              {/* Stacked Bar */}
              <div
                className="w-full bg-foreground/20 rounded-sm h-4 relative group cursor-pointer"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Federal portion (blue) */}
                {item.federalAmount > 0 && (
                  <div
                    className="h-4 absolute left-0 top-0 bg-chart-1"
                    style={{
                      width: `${federalWidth}%`,
                      borderRadius:
                        item.provincialAmount > 0 ? "2px 0 0 2px" : "2px",
                    }}
                  />
                )}

                {/* Provincial portion (orange) */}
                {item.provincialAmount > 0 && (
                  <div
                    className="h-4 absolute top-0 bg-chart-3"
                    style={{
                      left: `${federalWidth}%`,
                      width: `${provincialWidth}%`,
                      borderRadius:
                        item.federalAmount > 0 ? "0 2px 2px 0" : "2px",
                    }}
                  />
                )}

                {/* Tooltip */}
                {hoveredItem === item.name && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-foreground text-card text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                    <div className="space-y-1">
                      {item.federalAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-chart-1" />
                          <span>
                            Federal: {formatCurrency(item.federalAmount)}
                          </span>
                        </div>
                      )}
                      {item.provincialAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-chart-3" />
                          <span>
                            Provincial: {formatCurrency(item.provincialAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalAmount && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <div className="text-base font-semibold text-foreground">
              Your total tax contribution:
            </div>
            <div className="text-base font-bold text-foreground">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
