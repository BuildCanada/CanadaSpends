"use client";

import React, { useState, useMemo } from "react";
import { Trans } from "@lingui/react/macro";

import {
  calculateDetailedTax,
  getSupportedProvinces,
  SupportedYear,
} from "@/lib/tax";

// Format currency without decimal points
function formatCurrencyNoDecimals(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Province display names
const PROVINCE_NAMES: Record<string, string> = {
  alberta: "AB",
  "british-columbia": "BC",
  manitoba: "MB",
  "new-brunswick": "NB",
  "newfoundland-and-labrador": "NL",
  "northwest-territories": "NT",
  "nova-scotia": "NS",
  nunavut: "NU",
  ontario: "ON",
  "prince-edward-island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

const PROVINCE_FULL_NAMES: Record<string, string> = {
  alberta: "Alberta",
  "british-columbia": "British Columbia",
  manitoba: "Manitoba",
  "new-brunswick": "New Brunswick",
  "newfoundland-and-labrador": "Newfoundland and Labrador",
  "northwest-territories": "Northwest Territories",
  "nova-scotia": "Nova Scotia",
  nunavut: "Nunavut",
  ontario: "Ontario",
  "prince-edward-island": "Prince Edward Island",
  quebec: "Quebec",
  saskatchewan: "Saskatchewan",
  yukon: "Yukon",
};

interface JurisdictionData {
  province: string;
  provinceName: string;
  provinceAbbr: string;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  effectiveRate: number;
}

interface JurisdictionComparisonChartProps {
  income: number;
  year: SupportedYear;
  selectedProvince: string;
}

export function JurisdictionComparisonChart({
  income,
  year,
  selectedProvince,
}: JurisdictionComparisonChartProps) {
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Calculate taxes for all provinces
  const jurisdictionData = useMemo(() => {
    const provinces = getSupportedProvinces(year);
    const data: JurisdictionData[] = [];

    for (const province of provinces) {
      const calculation = calculateDetailedTax(income, province, year);
      if (calculation) {
        data.push({
          province,
          provinceName: PROVINCE_FULL_NAMES[province] || province,
          provinceAbbr: PROVINCE_NAMES[province] || province,
          federalTax: calculation.federalTax,
          provincialTax: calculation.provincialTax,
          totalTax: calculation.totalTax,
          effectiveRate: calculation.effectiveTaxRate,
        });
      }
    }

    // Sort by total tax (lowest to highest)
    return data.sort((a, b) => a.totalTax - b.totalTax);
  }, [income, year]);

  // Find the position of the selected province's total tax for the reference line
  const selectedProvinceData = jurisdictionData.find(
    (d) => d.province === selectedProvince,
  );
  // Use income as the reference width - bars show tax as proportion of income
  const selectedTaxPosition = selectedProvinceData
    ? (selectedProvinceData.totalTax / income) * 100
    : 0;

  if (income <= 0 || jurisdictionData.length === 0) {
    return null;
  }

  const selectedProvinceName = selectedProvinceData
    ? PROVINCE_FULL_NAMES[selectedProvinceData.province] ||
      selectedProvinceData.province
    : "";

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        <Trans>
          Tax Comparison Across Provinces at{" "}
          {new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(income)}{" "}
          Income
        </Trans>
      </h3>
      <p className="text-sm text-foreground/60 mb-6">
        <Trans>
          Compare your total tax burden across all Canadian provinces and
          territories
        </Trans>
      </p>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-chart-1" />
          <span className="text-sm font-medium text-foreground/70">
            <Trans>Federal</Trans>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-chart-3" />
          <span className="text-sm font-medium text-foreground/70">
            <Trans>Provincial</Trans>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-primary" />
          <span className="text-sm font-medium text-foreground/70">
            {selectedProvinceName}
          </span>
        </div>
      </div>

      {/* Chart with three columns: labels, bars, amounts */}
      <div className="flex gap-3">
        {/* Province labels column */}
        <div className="flex flex-col justify-between shrink-0 pt-6">
          {jurisdictionData.map((item) => {
            const isSelected = item.province === selectedProvince;
            return (
              <div
                key={item.province}
                className={`h-7 flex items-center justify-end w-8 text-sm font-medium ${
                  isSelected ? "text-primary font-bold" : "text-foreground/70"
                }`}
              >
                {item.provinceAbbr}
              </div>
            );
          })}
        </div>

        {/* Bars column with reference line */}
        <div className="flex-1 relative pt-6">
          {/* Reference line label */}
          <div
            className="absolute -top-0 text-xs font-medium text-primary whitespace-nowrap z-10"
            style={{
              left: `${selectedTaxPosition}%`,
              transform: "translateX(-50%)",
            }}
          >
            {formatCurrencyNoDecimals(selectedProvinceData?.totalTax ?? 0)}
          </div>

          {/* Reference line */}
          <div
            className="absolute border-l-2 border-dashed border-primary z-10 pointer-events-none"
            style={{
              left: `${selectedTaxPosition}%`,
              top: "1.25rem",
              bottom: "0",
            }}
          />

          {/* Bars */}
          <div className="flex flex-col justify-between h-full">
            {jurisdictionData.map((item) => {
              const totalBarWidth = (item.totalTax / income) * 100;
              const federalWidth =
                item.totalTax > 0
                  ? (item.federalTax / item.totalTax) * totalBarWidth
                  : 0;
              const provincialWidth =
                item.totalTax > 0
                  ? (item.provincialTax / item.totalTax) * totalBarWidth
                  : 0;
              const isSelected = item.province === selectedProvince;
              const isHovered = hoveredProvince === item.province;

              return (
                <div
                  key={item.province}
                  className={`h-7 flex items-center rounded transition-colors ${
                    isSelected
                      ? "bg-primary/10"
                      : isHovered
                        ? "bg-muted/50"
                        : ""
                  }`}
                  onMouseEnter={() => setHoveredProvince(item.province)}
                  onMouseLeave={() => setHoveredProvince(null)}
                >
                  <div className="w-full bg-foreground/10 rounded-sm h-5 relative cursor-pointer">
                    {/* Federal portion */}
                    {item.federalTax > 0 && (
                      <div
                        className="h-5 absolute left-0 top-0 bg-chart-1"
                        style={{
                          width: `${federalWidth}%`,
                          borderRadius:
                            item.provincialTax > 0 ? "2px 0 0 2px" : "2px",
                        }}
                      />
                    )}

                    {/* Provincial portion */}
                    {item.provincialTax > 0 && (
                      <div
                        className="h-5 absolute top-0 bg-chart-3"
                        style={{
                          left: `${federalWidth}%`,
                          width: `${provincialWidth}%`,
                          borderRadius:
                            item.federalTax > 0 ? "0 2px 2px 0" : "2px",
                        }}
                      />
                    )}

                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 bg-foreground text-card text-xs rounded py-2 px-3 whitespace-nowrap z-20 shadow-lg">
                        <div className="font-semibold mb-1">
                          {item.provinceName}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-chart-1" />
                            <span>
                              <Trans>Federal</Trans>:{" "}
                              {formatCurrencyNoDecimals(item.federalTax)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-sm bg-chart-3" />
                            <span>
                              <Trans>Provincial</Trans>:{" "}
                              {formatCurrencyNoDecimals(item.provincialTax)}
                            </span>
                          </div>
                          <div className="border-t border-card/20 pt-1 mt-1">
                            <span className="font-semibold">
                              <Trans>Total</Trans>:{" "}
                              {formatCurrencyNoDecimals(item.totalTax)} (
                              {item.effectiveRate.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Amounts column */}
        <div className="flex flex-col justify-between shrink-0 pt-6">
          {jurisdictionData.map((item) => {
            const isSelected = item.province === selectedProvince;
            return (
              <div
                key={item.province}
                className={`h-7 flex items-center w-20 text-sm text-right justify-end ${
                  isSelected
                    ? "text-primary font-bold"
                    : "text-foreground/70 font-medium"
                }`}
              >
                {formatCurrencyNoDecimals(item.totalTax)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {selectedProvinceData && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap justify-between items-center gap-4 text-sm">
            <div className="text-foreground/70">
              <Trans>
                In {selectedProvinceData.provinceName}, you pay{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrencyNoDecimals(selectedProvinceData.totalTax)}
                </span>{" "}
                in total tax ({selectedProvinceData.effectiveRate.toFixed(1)}%
                effective rate)
              </Trans>
            </div>
            <div className="text-foreground/70">
              <Trans>
                Ranked{" "}
                <span className="font-semibold text-foreground">
                  #
                  {jurisdictionData.findIndex(
                    (d) => d.province === selectedProvince,
                  ) + 1}
                </span>{" "}
                of {jurisdictionData.length} lowest tax
              </Trans>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
