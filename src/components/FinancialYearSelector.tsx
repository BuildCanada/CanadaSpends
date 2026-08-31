"use client";

import Link from "next/link";
import { Trans } from "@lingui/react/macro";

export function FinancialYearSelector({
  basePath,
  currentYear,
  availableYears,
  formatYear,
}: {
  basePath: string;
  currentYear: string;
  availableYears: string[];
  formatYear?: (year: string) => string;
}) {
  if (availableYears.length <= 1) return null;

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="mb-4 text-lg font-medium text-gray-900">
        <Trans>View Other Fiscal Years</Trans>
      </h3>
      <div className="flex flex-wrap gap-2">
        {availableYears.map((year) => {
          const current = year === currentYear;
          return (
            <Link
              key={year}
              href={`${basePath}/${year}`}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                current
                  ? "cursor-default bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-current={current ? "page" : undefined}
            >
              {formatYear ? formatYear(year) : <Trans>FY {year}</Trans>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
