"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/taxCalculator";
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

const FEDERAL_COLOR = "#2563eb"; // Blue
const PROVINCIAL_COLOR = "#f97316"; // Orange

export function CombinedSpendingChart({
  data,
  title,
  totalAmount,
}: CombinedSpendingChartProps) {
  const maxAmount = Math.max(...data.map((item) => item.totalAmount));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: FEDERAL_COLOR }}
          />
          <span className="text-sm font-medium text-gray-700">Federal</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: PROVINCIAL_COLOR }}
          />
          <span className="text-sm font-medium text-gray-700">Provincial</span>
        </div>
      </div>
      <div></div>
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
                className="w-full bg-gray-100 rounded-sm h-4 relative group cursor-pointer"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Federal portion (blue) */}
                {item.federalAmount > 0 && (
                  <div
                    className="h-4 absolute left-0 top-0"
                    style={{
                      width: `${federalWidth}%`,
                      backgroundColor: FEDERAL_COLOR,
                      borderRadius:
                        item.provincialAmount > 0 ? "2px 0 0 2px" : "2px",
                    }}
                  />
                )}

                {/* Provincial portion (orange) */}
                {item.provincialAmount > 0 && (
                  <div
                    className="h-4 absolute top-0"
                    style={{
                      left: `${federalWidth}%`,
                      width: `${provincialWidth}%`,
                      backgroundColor: PROVINCIAL_COLOR,
                      borderRadius:
                        item.federalAmount > 0 ? "0 2px 2px 0" : "2px",
                    }}
                  />
                )}

                {/* Tooltip */}
                {hoveredItem === item.name && (
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                    <div className="space-y-1">
                      {item.federalAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: FEDERAL_COLOR }}
                          />
                          <span>
                            Federal: {formatCurrency(item.federalAmount)}
                          </span>
                        </div>
                      )}
                      {item.provincialAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: PROVINCIAL_COLOR }}
                          />
                          <span>
                            Provincial: {formatCurrency(item.provincialAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalAmount && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-base font-semibold text-gray-900">
              Your total tax contribution:
            </div>
            <div className="text-base font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
