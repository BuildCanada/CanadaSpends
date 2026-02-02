"use client";

import { Trans } from "@lingui/react/macro";
import type { Remuneration } from "@/lib/supabase/types";

interface RemunerationTableProps {
  data: Remuneration;
}

function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) {
    return "-";
  }
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function RemunerationTable({ data }: RemunerationTableProps) {
  if (!data.entries || data.entries.length === 0) {
    return (
      <p className="text-gray-500 italic">
        <Trans>No remuneration data available.</Trans>
      </p>
    );
  }

  // Determine which columns to show based on the data
  const hasHonorarium = data.entries.some(
    (e) => e.values.honorarium !== undefined,
  );
  const hasContract = data.entries.some((e) => e.values.contract !== undefined);
  const hasSalary = data.entries.some((e) => e.values.salary !== undefined);
  const hasTravel = data.entries.some((e) => e.values.travel !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <Trans>Position</Trans>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <Trans>Name</Trans>
            </th>
            {hasSalary && (
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <Trans>Salary</Trans>
              </th>
            )}
            {hasHonorarium && (
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <Trans>Honorarium</Trans>
              </th>
            )}
            {hasContract && (
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <Trans>Contract</Trans>
              </th>
            )}
            {hasTravel && (
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <Trans>Travel</Trans>
              </th>
            )}
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <Trans>Total</Trans>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.entries.map((entry, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {entry.position || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {entry.name || "-"}
              </td>
              {hasSalary && (
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(entry.values.salary)}
                </td>
              )}
              {hasHonorarium && (
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(entry.values.honorarium)}
                </td>
              )}
              {hasContract && (
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(entry.values.contract)}
                </td>
              )}
              {hasTravel && (
                <td className="px-4 py-3 text-sm text-gray-900 text-right">
                  {formatCurrency(entry.values.travel)}
                </td>
              )}
              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                {formatCurrency(entry.row_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {data.is_audited !== undefined && (
        <p className="mt-4 text-sm text-gray-500">
          {data.is_audited ? (
            <Trans>This schedule has been audited.</Trans>
          ) : (
            <Trans>This schedule is unaudited.</Trans>
          )}
          {data.auditor_name && (
            <span>
              {" "}
              <Trans>Prepared by: {data.auditor_name}</Trans>
            </span>
          )}
        </p>
      )}
    </div>
  );
}
