"use client";

import { Trans } from "@lingui/react/macro";
import { Tooltip } from "@/components/Tooltip";
import type { StatementOfFinancialPosition } from "@/lib/supabase/types";

interface FinancialPositionStatsProps {
  data: StatementOfFinancialPosition;
  fiscalYear: string;
}

const HelpIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="ml-2 text-gray-500 cursor-pointer"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

function formatCurrency(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (absolute >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Get the value for a specific year from line item values
 */
function getValue(
  values: Record<string, number | null | undefined>,
  year: number,
): number {
  // Try to find the value for the specific year
  const yearKey = String(year);
  if (values[yearKey] !== null && values[yearKey] !== undefined) {
    return values[yearKey] as number;
  }

  // Also try actual_YYYY format
  const actualKey = `actual_${year}`;
  if (values[actualKey] !== null && values[actualKey] !== undefined) {
    return values[actualKey] as number;
  }

  // Fallback to most recent value
  for (const [key, value] of Object.entries(values)) {
    if (
      value !== null &&
      value !== undefined &&
      !key.includes("budget") &&
      typeof value === "number"
    ) {
      return value;
    }
  }

  return 0;
}

const StatBox = ({
  title,
  value,
  description,
}: {
  title: React.ReactNode;
  value: React.ReactNode;
  description: React.ReactNode;
}) => (
  <div className="flex flex-col mr-8 mb-8">
    <div className="text-sm text-gray-600 mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </div>
);

export function FinancialPositionStats({
  data,
  fiscalYear,
}: FinancialPositionStatsProps) {
  // Extract the year from the fiscal year string (e.g., "2023-24" -> 2024)
  const year = parseInt(fiscalYear.split("-").pop() || fiscalYear, 10);
  const fullYear = year < 100 ? 2000 + year : year;

  // Find key totals from line items
  const findLineItem = (
    predicate: (item: (typeof data.line_items)[0]) => boolean,
  ) => {
    return data.line_items.find(predicate);
  };

  const totalFinancialAssets = findLineItem(
    (item) =>
      item.is_subtotal &&
      item.name.toLowerCase().includes("total financial assets"),
  );

  const totalLiabilities = findLineItem(
    (item) =>
      item.is_subtotal &&
      item.name.toLowerCase().includes("total financial liabilities"),
  );

  const netDebt = findLineItem((item) =>
    item.name.toLowerCase().includes("net debt"),
  );

  const totalNonFinancialAssets = findLineItem(
    (item) =>
      item.is_subtotal &&
      item.name.toLowerCase().includes("total non financial assets"),
  );

  const netAssets = findLineItem(
    (item) => item.is_total && item.name.toLowerCase().includes("net assets"),
  );

  const accumulatedSurplus = findLineItem(
    (item) =>
      item.name.toLowerCase().includes("accumulated surplus") && !item.is_total,
  );

  const stats: {
    key: string;
    title: React.ReactNode;
    value: React.ReactNode;
    description: React.ReactNode;
  }[] = [];

  if (totalFinancialAssets) {
    stats.push({
      key: "total-financial-assets",
      title: (
        <div className="flex items-center">
          <Trans>Total Financial Assets</Trans>
          <Tooltip
            text={
              <Trans>
                Cash, investments, accounts receivable, and other assets that
                can be converted to cash.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatCurrency(getValue(totalFinancialAssets.values, fullYear)),
      description: <Trans>As of fiscal year end {fiscalYear}</Trans>,
    });
  }

  if (totalLiabilities) {
    stats.push({
      key: "total-liabilities",
      title: (
        <div className="flex items-center">
          <Trans>Total Liabilities</Trans>
          <Tooltip
            text={
              <Trans>
                Accounts payable, long-term debt, and other obligations owed to
                external parties.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatCurrency(getValue(totalLiabilities.values, fullYear)),
      description: <Trans>As of fiscal year end {fiscalYear}</Trans>,
    });
  }

  if (netDebt) {
    const netDebtValue = getValue(netDebt.values, fullYear);
    stats.push({
      key: "net-debt",
      title: (
        <div className="flex items-center">
          <Trans>Net Debt</Trans>
          <Tooltip
            text={
              <Trans>
                Financial liabilities minus financial assets. A negative value
                indicates net financial assets.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value:
        netDebtValue < 0
          ? `${formatCurrency(Math.abs(netDebtValue))} (surplus)`
          : formatCurrency(netDebtValue),
      description: <Trans>Financial liabilities less financial assets</Trans>,
    });
  }

  if (totalNonFinancialAssets) {
    stats.push({
      key: "non-financial-assets",
      title: (
        <div className="flex items-center">
          <Trans>Non-Financial Assets</Trans>
          <Tooltip
            text={
              <Trans>
                Tangible capital assets such as land, buildings, equipment, and
                infrastructure.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatCurrency(getValue(totalNonFinancialAssets.values, fullYear)),
      description: <Trans>As of fiscal year end {fiscalYear}</Trans>,
    });
  }

  if (netAssets) {
    stats.push({
      key: "net-assets",
      title: (
        <div className="flex items-center">
          <Trans>Net Assets</Trans>
          <Tooltip
            text={
              <Trans>
                Total assets minus total liabilities. This represents the
                band&apos;s overall financial position.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatCurrency(getValue(netAssets.values, fullYear)),
      description: <Trans>Total net assets</Trans>,
    });
  }

  if (accumulatedSurplus) {
    stats.push({
      key: "accumulated-surplus",
      title: (
        <div className="flex items-center">
          <Trans>Accumulated Surplus</Trans>
          <Tooltip
            text={
              <Trans>
                The cumulative surplus accumulated over time from operations.
              </Trans>
            }
          >
            <HelpIcon />
          </Tooltip>
        </div>
      ),
      value: formatCurrency(getValue(accumulatedSurplus.values, fullYear)),
      description: <Trans>Total accumulated surplus</Trans>,
    });
  }

  if (stats.length === 0) {
    return (
      <p className="text-gray-500 italic">
        <Trans>No financial position data available.</Trans>
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <StatBox
          key={stat.key}
          title={stat.title}
          value={stat.value}
          description={stat.description}
        />
      ))}
    </div>
  );
}
