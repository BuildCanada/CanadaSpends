"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Trans } from "@lingui/react/macro";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  FileText,
  Loader2,
} from "lucide-react";
import type { BandRemunerationSummary } from "@/lib/supabase/remuneration";
import type { RemunerationEntryRow } from "@/lib/supabase/remuneration";

const CDN_BASE_URL = "https://cdn.canadaspends.com";

function formatCurrency(value: number | null | undefined): string {
  if (value === undefined || value === null) return "-";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === undefined || value === null) return "-";
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

type SortKey =
  | "fiscal_year_end"
  | "official_name"
  | "position"
  | "compensation"
  | "expenses"
  | "row_total"
  | "months_in_office";

type SortDirection = "asc" | "desc";

function getSortValue(
  entry: RemunerationEntryRow,
  key: SortKey,
): string | number {
  switch (key) {
    case "fiscal_year_end":
      return entry.fiscal_year_end;
    case "official_name":
      return entry.official_name;
    case "position":
      return entry.position;
    case "compensation":
      return entry.compensation;
    case "expenses":
      return entry.expenses;
    case "row_total":
      return entry.row_total;
    case "months_in_office":
      return entry.months_in_office ?? 0;
  }
}

function SortIcon({
  columnKey,
  activeKey,
  direction,
}: {
  columnKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
}) {
  if (columnKey !== activeKey) {
    return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
  }
  return direction === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1" />
  );
}

interface RemunerationBreakdownProps {
  summaries: BandRemunerationSummary[];
  entries: RemunerationEntryRow[];
}

export function RemunerationBreakdown({
  summaries,
  entries,
}: RemunerationBreakdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("fiscal_year_end");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const isSearching = debouncedSearch !== searchQuery;

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (const s of summaries) {
      yearsSet.add(s.fiscal_year_end);
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [summaries]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDirection(
          key === "official_name" || key === "position" ? "asc" : "desc",
        );
      }
    },
    [sortKey],
  );

  const filtered = useMemo(() => {
    let result = entries;

    if (selectedYear) {
      result = result.filter((e) => e.fiscal_year_end === Number(selectedYear));
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (e) =>
          e.official_name.toLowerCase().includes(query) ||
          e.position.toLowerCase().includes(query),
      );
    }

    const sorted = [...result].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      let cmp: number;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = (aVal as number) - (bVal as number);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [entries, selectedYear, debouncedSearch, sortKey, sortDirection]);

  // Build a lookup from year to summary for source PDFs
  const summaryByYear = useMemo(() => {
    const map = new Map<number, BandRemunerationSummary>();
    for (const s of summaries) {
      map.set(s.fiscal_year_end, s);
    }
    return map;
  }, [summaries]);

  // Compute totals for the filtered set
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, e) => ({
        compensation: acc.compensation + e.compensation,
        expenses: acc.expenses + e.expenses,
        total: acc.total + e.row_total,
      }),
      { compensation: 0, expenses: 0, total: 0 },
    );
  }, [filtered]);

  const thClass =
    "px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap";

  return (
    <div>
      {/* Year Summary Cards */}
      {summaries.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {summaries.map((s) => (
            <div
              key={s.fiscal_year_end}
              className="bg-white border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">
                  FY {s.fiscal_year_end}
                </span>
                {s.source_pdf_r2_path && (
                  <a
                    href={`${CDN_BASE_URL}/${s.source_pdf_r2_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-auburn-700 hover:text-auburn-900"
                    title="View source PDF"
                  >
                    <FileText className="w-4 h-4" />
                  </a>
                )}
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrencyCompact(s.total_remuneration)}
              </p>
              <p className="text-xs text-gray-500">
                {s.officials_count} <Trans>officials</Trans>
                {s.chief_name && (
                  <>
                    {" "}
                    &middot; <Trans>Chief</Trans>: {s.chief_name}
                  </>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or position..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-auburn-500 focus:border-auburn-500 text-base"
          />
        </div>
        {availableYears.length > 1 && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block w-full sm:w-48 py-3 px-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-auburn-500 focus:border-auburn-500 text-base bg-white"
          >
            <option value="">All years</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                FY {y}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        {searchQuery || selectedYear ? (
          <Trans>
            Showing {filtered.length} of {entries.length} entries
          </Trans>
        ) : (
          <Trans>
            {entries.length} remuneration entries across {availableYears.length}{" "}
            year(s)
          </Trans>
        )}
        {isSearching && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            <Trans>No entries found matching your search.</Trans>
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.map((entry, i) => (
              <div
                key={`${entry.fiscal_year_end}-${entry.entry_index}-${i}`}
                className="bg-white border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {entry.official_name}
                    </p>
                    <p className="text-xs text-gray-500">{entry.position}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-600 ml-2 flex-shrink-0">
                    FY {entry.fiscal_year_end}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">
                      <Trans>Compensation</Trans>
                    </span>
                    <p className="font-medium">
                      {formatCurrency(entry.compensation)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">
                      <Trans>Expenses</Trans>
                    </span>
                    <p className="font-medium">
                      {formatCurrency(entry.expenses)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">
                      <Trans>Total</Trans>
                    </span>
                    <p className="font-medium">
                      {formatCurrency(entry.row_total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("fiscal_year_end")}
                  >
                    <Trans>Year</Trans>
                    <SortIcon
                      columnKey="fiscal_year_end"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-left`}
                    onClick={() => handleSort("official_name")}
                  >
                    <Trans>Name</Trans>
                    <SortIcon
                      columnKey="official_name"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-left`}
                    onClick={() => handleSort("position")}
                  >
                    <Trans>Position</Trans>
                    <SortIcon
                      columnKey="position"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("compensation")}
                  >
                    <Trans>Compensation</Trans>
                    <SortIcon
                      columnKey="compensation"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("expenses")}
                  >
                    <Trans>Expenses</Trans>
                    <SortIcon
                      columnKey="expenses"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("row_total")}
                  >
                    <Trans>Total</Trans>
                    <SortIcon
                      columnKey="row_total"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("months_in_office")}
                  >
                    <Trans>Months</Trans>
                    <SortIcon
                      columnKey="months_in_office"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap"
                  >
                    <Trans>Source</Trans>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((entry, i) => {
                  const summary = summaryByYear.get(entry.fiscal_year_end);
                  return (
                    <tr
                      key={`${entry.fiscal_year_end}-${entry.entry_index}-${i}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">
                        {entry.fiscal_year_end}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.official_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {entry.position}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(entry.compensation)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(entry.expenses)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(entry.row_total)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {entry.months_in_office !== null
                          ? entry.months_in_office
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {summary?.source_pdf_r2_path ? (
                          <a
                            href={`${CDN_BASE_URL}/${summary.source_pdf_r2_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-auburn-700 hover:text-auburn-900"
                            title="View source PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr className="font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-900" colSpan={3}>
                    <Trans>Total</Trans>
                    {selectedYear || debouncedSearch ? (
                      <span className="font-normal text-gray-500 ml-1">
                        ({filtered.length} entries)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(totals.compensation)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(totals.expenses)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(totals.total)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile totals */}
          <div className="md:hidden mt-4 bg-gray-100 border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              <Trans>Totals</Trans>
            </p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-500 text-xs">
                  <Trans>Compensation</Trans>
                </span>
                <p className="font-medium">
                  {formatCurrencyCompact(totals.compensation)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">
                  <Trans>Expenses</Trans>
                </span>
                <p className="font-medium">
                  {formatCurrencyCompact(totals.expenses)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">
                  <Trans>Total</Trans>
                </span>
                <p className="font-medium">
                  {formatCurrencyCompact(totals.total)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
