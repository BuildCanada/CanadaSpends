"use client";

import { useState, useMemo } from "react";
import { BarChart, type ReferenceLineConfig } from "@/components/BarChart";
import { useLingui } from "@lingui/react/macro";
import { Trans } from "@lingui/react/macro";
import {
  salaryData,
  years,
  groups,
  type SalaryRange,
  adjustSalaryRangeForInflation,
} from "@/lib/salaryData";

// Function to calculate the median salary bucket
const calculateMedianBucket = (data: SalaryRange[]): string | null => {
  if (!data || data.length === 0) return null;

  const totalEmployees = data.reduce((sum, item) => sum + item.count, 0);
  const medianPosition = totalEmployees / 2;

  let cumulativeCount = 0;
  for (const item of data) {
    cumulativeCount += item.count;
    if (cumulativeCount >= medianPosition) {
      return item.range;
    }
  }

  return null;
};

export const SalaryDistributionChart = () => {
  const { t } = useLingui();
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1]); // Default to most recent year
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);

  const currentData = salaryData[selectedYear]?.[selectedGroup] || [];

  // Calculate the median bucket
  const medianBucket = useMemo(
    () => calculateMedianBucket(currentData),
    [currentData],
  );

  const chartData = currentData.map((item: SalaryRange) => ({
    range: showInflationAdjusted
      ? adjustSalaryRangeForInflation(item.range, selectedYear)
      : item.range,
    Employees: item.count,
  }));

  // Define reference lines
  const referenceLines: ReferenceLineConfig[] = useMemo(() => {
    if (!medianBucket) return [];

    const adjustedMedian = showInflationAdjusted
      ? adjustSalaryRangeForInflation(medianBucket, selectedYear)
      : medianBucket;

    return [
      {
        value: adjustedMedian,
        color: "amber",
        label: "Median Salary",
        axis: "x",
      },
    ];
  }, [medianBucket, showInflationAdjusted, selectedYear]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label
            htmlFor="year-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <Trans>Year</Trans>
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label
            htmlFor="group-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <Trans>Group</Trans>
          </label>
          <select
            id="group-select"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="block p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showInflationAdjusted}
              onChange={(e) => setShowInflationAdjusted(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              <Trans>Adjust for inflation (2025 dollars)</Trans>
            </span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          <Trans>
            Salary Distribution - {selectedYear} ({selectedGroup})
          </Trans>
          {showInflationAdjusted && (
            <span className="text-sm text-gray-500 ml-2">
              <Trans>(inflation-adjusted to 2025 dollars)</Trans>
            </span>
          )}
        </h3>

        <BarChart
          className="h-80"
          data={chartData}
          index="range"
          categories={["Employees"]}
          colors={["blue"]}
          showLegend={true}
          showGridLines={true}
          xAxisLabel={t`Salary Range`}
          yAxisLabel={t`Number of Employees`}
          referenceLines={referenceLines}
        />

        {selectedYear !== "2023" && selectedYear !== "2024" && (
          <p className="text-xs text-gray-500 mt-4 italic">
            <Trans>
              Note the different salary ranges prior to 2023. Information for
              small numbers has been suppressed (values of 0 are actually counts
              of 1 to 5).
            </Trans>
          </p>
        )}
      </div>
    </div>
  );
};
