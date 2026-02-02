"use client";

import Link from "next/link";
import { Trans } from "@lingui/react/macro";

interface BandYearSelectorProps {
  bcid: string;
  currentYear: string;
  availableYears: string[];
  lang: string;
}

export function BandYearSelector({
  bcid,
  currentYear,
  availableYears,
  lang,
}: BandYearSelectorProps) {
  if (availableYears.length <= 1) {
    return null;
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        <Trans>View Other Fiscal Years</Trans>
      </h3>
      <div className="flex flex-wrap gap-2">
        {availableYears.map((year) => {
          const isCurrentYear = year === currentYear;
          return (
            <Link
              key={year}
              href={`/${lang}/first-nations/${bcid}/${year}`}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isCurrentYear
                  ? "bg-indigo-600 text-white cursor-default"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-current={isCurrentYear ? "page" : undefined}
            >
              {formatFiscalYear(year)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function formatFiscalYear(year: string): string {
  // If year is in format "2024-03-31", show "FY 2023-24"
  // If year is just "2024", show "FY 2024"
  if (year.includes("-")) {
    const date = new Date(year);
    const endYear = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // If fiscal year ends in early months (Jan-Mar), it's for the previous calendar year
    if (month <= 2) {
      // January = 0, February = 1, March = 2
      const startYear = endYear - 1;
      return `FY ${startYear}-${String(endYear).slice(-2)}`;
    } else {
      const nextYear = endYear + 1;
      return `FY ${endYear}-${String(nextYear).slice(-2)}`;
    }
  }

  return `FY ${year}`;
}
