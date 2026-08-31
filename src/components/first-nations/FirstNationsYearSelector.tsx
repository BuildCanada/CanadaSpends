"use client";

import { FinancialYearSelector } from "@/components/FinancialYearSelector";

interface FirstNationsYearSelectorProps {
  bcid: string;
  currentYear: string;
  availableYears: string[];
  lang: string;
}

export function FirstNationsYearSelector({
  bcid,
  currentYear,
  availableYears,
  lang,
}: FirstNationsYearSelectorProps) {
  return (
    <FinancialYearSelector
      basePath={`/${lang}/first-nations/${bcid}`}
      currentYear={currentYear}
      availableYears={availableYears}
      formatYear={formatFiscalYear}
    />
  );
}

function formatFiscalYear(year: string): string {
  if (!year.includes("-")) return `FY ${year}`;

  const date = new Date(`${year}T00:00:00Z`);
  const endYear = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return month <= 2
    ? `FY ${endYear - 1}-${String(endYear).slice(-2)}`
    : `FY ${endYear}-${String(endYear + 1).slice(-2)}`;
}
