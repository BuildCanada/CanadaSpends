"use client";

import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  FileText,
  Loader2,
} from "lucide-react";
import type {
  BandRemunerationSummary,
  RemunerationEntryRow,
} from "@/lib/supabase/remuneration";

const PAGE_SIZE = 100;

const PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

const SUPABASE_BASE_URL = "https://api.buildcanada.com/rest/v1";
const SUPABASE_API_KEY = "sb_publishable_nDRd3MFmMdzRsDfAkDPc3g_xWbSiV19";
const CDN_BASE_URL = "https://cdn.canadaspends.com";

function formatCurrency(value: number | null | undefined): string {
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

function formatNumber(value: number | null | undefined): string {
  if (value === undefined || value === null) return "-";
  return value.toLocaleString("en-CA");
}

type SortKey =
  | "band_name"
  | "province"
  | "fiscal_year_end"
  | "pop_total"
  | "pop_on_reserve_total"
  | "chief_name"
  | "officials_count"
  | "total_compensation"
  | "total_expenses"
  | "total_remuneration";

type SortDirection = "asc" | "desc";

const COLUMN_COUNT = 11;

function getSortValue(
  band: BandRemunerationSummary,
  key: SortKey,
): string | number {
  switch (key) {
    case "band_name":
      return band.band_name;
    case "province":
      return band.province;
    case "fiscal_year_end":
      return band.fiscal_year_end;
    case "pop_total":
      return band.pop_total ?? 0;
    case "pop_on_reserve_total":
      return band.pop_on_reserve_total ?? 0;
    case "chief_name":
      return band.chief_name ?? "";
    case "officials_count":
      return band.officials_count;
    case "total_compensation":
      return band.total_compensation;
    case "total_expenses":
      return band.total_expenses;
    case "total_remuneration":
      return band.total_remuneration;
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

interface RemunerationOverviewProps {
  summaries: BandRemunerationSummary[];
  lang: string;
}

export function RemunerationOverview({
  summaries,
  lang,
}: RemunerationOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("total_remuneration");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Debounce search input
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setVisibleCount(PAGE_SIZE); // Reset pagination on search change
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedProvince, selectedYear, sortKey, sortDirection]);

  const isSearching = debouncedSearch !== searchQuery;

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (const s of summaries) {
      yearsSet.add(s.fiscal_year_end);
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [summaries]);

  const availableProvinces = useMemo(() => {
    const provincesSet = new Set<string>();
    for (const s of summaries) {
      if (s.province) provincesSet.add(s.province);
    }
    return Array.from(provincesSet).sort();
  }, [summaries]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (key === sortKey) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        // Default to desc for numeric columns, asc for text
        setSortDirection(
          key === "band_name" || key === "province" || key === "chief_name"
            ? "asc"
            : "desc",
        );
      }
    },
    [sortKey],
  );

  const filtered = useMemo(() => {
    let result = summaries;

    if (selectedYear) {
      result = result.filter((s) => s.fiscal_year_end === Number(selectedYear));
    }

    if (selectedProvince) {
      result = result.filter((s) => s.province === selectedProvince);
    }

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.band_name.toLowerCase().includes(query) ||
          (s.chief_name && s.chief_name.toLowerCase().includes(query)),
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
  }, [
    summaries,
    selectedYear,
    selectedProvince,
    debouncedSearch,
    sortKey,
    sortDirection,
  ]);

  // Paginated results - only render what's visible
  const visibleResults = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  const thClass =
    "px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap";

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative w-full md:flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search First Nations or chiefs..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-auburn-500 focus:border-auburn-500 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:contents">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="block w-full md:w-64 py-3 px-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-auburn-500 focus:border-auburn-500 text-base bg-white"
          >
            <option value="">All provinces</option>
            {availableProvinces.map((p) => (
              <option key={p} value={p}>
                {PROVINCE_NAMES[p] || p}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="block w-full md:w-48 py-3 px-3 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-auburn-500 focus:border-auburn-500 text-base bg-white"
          >
            <option value="">All years</option>
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>
                FY {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-600 flex items-center gap-2">
        {searchQuery || selectedProvince || selectedYear ? (
          <Trans>
            Showing {filtered.length} of {summaries.length} results
          </Trans>
        ) : (
          <Trans>{filtered.length} First Nations with remuneration data</Trans>
        )}
        {isSearching && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            <Trans>No First Nations found matching your search.</Trans>
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {visibleResults.map((band) => (
              <BandCard
                key={`${band.bcid}-${band.fiscal_year_end}`}
                band={band}
                lang={lang}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:flex relative w-screen -ml-[50vw] left-1/2 right-1/2 overflow-auto border-y border-gray-200 justify-center">
            <table className="divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className={`${thClass} text-left`}
                    onClick={() => handleSort("band_name")}
                  >
                    <Trans>First Nation</Trans>
                    <SortIcon
                      columnKey="band_name"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-left`}
                    onClick={() => handleSort("province")}
                  >
                    <Trans>Prov.</Trans>
                    <SortIcon
                      columnKey="province"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
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
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("pop_total")}
                  >
                    <Trans>Total Pop.</Trans>
                    <SortIcon
                      columnKey="pop_total"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("pop_on_reserve_total")}
                  >
                    <Trans>On-Reserve Pop.</Trans>
                    <SortIcon
                      columnKey="pop_on_reserve_total"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-left`}
                    onClick={() => handleSort("chief_name")}
                  >
                    <Trans>Chief</Trans>
                    <SortIcon
                      columnKey="chief_name"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("officials_count")}
                  >
                    <Trans>Officials</Trans>
                    <SortIcon
                      columnKey="officials_count"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("total_compensation")}
                  >
                    <Trans>Compensation</Trans>
                    <SortIcon
                      columnKey="total_compensation"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("total_expenses")}
                  >
                    <Trans>Expenses</Trans>
                    <SortIcon
                      columnKey="total_expenses"
                      activeKey={sortKey}
                      direction={sortDirection}
                    />
                  </th>
                  <th
                    scope="col"
                    className={`${thClass} text-right`}
                    onClick={() => handleSort("total_remuneration")}
                  >
                    <Trans>Total Remuneration</Trans>
                    <SortIcon
                      columnKey="total_remuneration"
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
                {visibleResults.map((band) => (
                  <ExpandableRow
                    key={`${band.bcid}-${band.fiscal_year_end}`}
                    band={band}
                    lang={lang}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Show more button */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition-colors"
              >
                <Trans>
                  Show more ({filtered.length - visibleCount} remaining)
                </Trans>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const BandCard = memo(function BandCard({
  band,
  lang,
}: {
  band: BandRemunerationSummary;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<RemunerationEntryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!entries) {
      setLoading(true);
      try {
        const res = await fetch(
          `${SUPABASE_BASE_URL}/remuneration_entries?bcid=eq.${encodeURIComponent(band.bcid)}&fiscal_year_end=eq.${band.fiscal_year_end}&order=entry_index.asc`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              "Content-Type": "application/json",
            },
          },
        );
        if (res.ok) {
          setEntries(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
  }, [expanded, entries, band.bcid, band.fiscal_year_end]);

  return (
    <div className="bg-white border border-gray-200 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <Link
            href={`/${lang}/first-nations/remuneration/${band.bcid}`}
            className="text-base font-medium text-auburn-700 hover:text-auburn-900 hover:underline block"
          >
            {band.band_name}
          </Link>
          <span className="text-xs text-gray-500 block">
            FY {band.fiscal_year_end}
            {band.chief_name && <> &middot; Chief: {band.chief_name}</>}
          </span>
        </div>
        <span className="text-sm text-gray-600 ml-2 flex-shrink-0">
          {PROVINCE_NAMES[band.province] || band.province}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div>
          <span className="text-gray-500 text-xs">
            <Trans>Total Pop.</Trans>
          </span>
          <p className="font-medium">{formatNumber(band.pop_total)}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">
            <Trans>On-Reserve Pop.</Trans>
          </span>
          <p className="font-medium">
            {formatNumber(band.pop_on_reserve_total)}
          </p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">
            <Trans>Compensation</Trans>
          </span>
          <p className="font-medium">
            {formatCurrency(band.total_compensation)}
          </p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">
            <Trans>Expenses</Trans>
          </span>
          <p className="font-medium">{formatCurrency(band.total_expenses)}</p>
        </div>
        <div>
          <span className="text-gray-500 text-xs">
            <Trans>Total Remuneration</Trans>
          </span>
          <p className="font-medium">
            {formatCurrency(band.total_remuneration)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        {band.source_pdf_r2_path && (
          <a
            href={`${CDN_BASE_URL}/${band.source_pdf_r2_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-auburn-700 hover:text-auburn-900 flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            <Trans>Source PDF</Trans>
          </a>
        )}
      </div>

      <button
        onClick={handleExpand}
        className="mt-3 text-sm text-auburn-700 hover:text-auburn-900 flex items-center gap-1"
      >
        {expanded ? (
          <>
            <ChevronDown className="w-4 h-4" />
            <Trans>Hide details</Trans>
          </>
        ) : (
          <>
            <ChevronRight className="w-4 h-4" />
            <Trans>Show individual entries</Trans>
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : entries && entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className="bg-gray-50 p-3 text-sm border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{entry.official_name}</p>
                      <p className="text-xs text-gray-500">{entry.position}</p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(entry.row_total)}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                    <div>
                      <Trans>Compensation</Trans>:{" "}
                      {formatCurrency(entry.compensation)}
                    </div>
                    <div>
                      <Trans>Expenses</Trans>: {formatCurrency(entry.expenses)}
                    </div>
                    {entry.months_in_office !== null && (
                      <div>
                        <Trans>Months</Trans>: {entry.months_in_office}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              <Trans>No individual entries available.</Trans>
            </p>
          )}
        </div>
      )}
    </div>
  );
});

const ExpandableRow = memo(function ExpandableRow({
  band,
  lang,
}: {
  band: BandRemunerationSummary;
  lang: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<RemunerationEntryRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = useCallback(async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (!entries) {
      setLoading(true);
      try {
        const res = await fetch(
          `${SUPABASE_BASE_URL}/remuneration_entries?bcid=eq.${encodeURIComponent(band.bcid)}&fiscal_year_end=eq.${band.fiscal_year_end}&order=entry_index.asc`,
          {
            headers: {
              apikey: SUPABASE_API_KEY,
              "Content-Type": "application/json",
            },
          },
        );
        if (res.ok) {
          setEntries(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
  }, [expanded, entries, band.bcid, band.fiscal_year_end]);

  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer group"
        onClick={handleExpand}
      >
        <td className="px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <Link
              href={`/${lang}/first-nations/remuneration/${band.bcid}`}
              className="font-medium text-auburn-700 hover:text-auburn-900 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {band.band_name}
            </Link>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{band.province}</td>
        <td className="px-4 py-3 text-sm text-gray-600 text-right">
          {band.fiscal_year_end}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 text-right">
          {formatNumber(band.pop_total)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 text-right">
          {formatNumber(band.pop_on_reserve_total)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {band.chief_name || "-"}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 text-right">
          {band.officials_count}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 text-right">
          {formatCurrency(band.total_compensation)}
        </td>
        <td className="px-4 py-3 text-sm text-gray-900 text-right">
          {formatCurrency(band.total_expenses)}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
          {formatCurrency(band.total_remuneration)}
        </td>
        <td className="px-4 py-3 text-sm text-center">
          {band.source_pdf_r2_path ? (
            <a
              href={`${CDN_BASE_URL}/${band.source_pdf_r2_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-auburn-700 hover:text-auburn-900"
              onClick={(e) => e.stopPropagation()}
              title="View source PDF"
            >
              <FileText className="w-4 h-4" />
            </a>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={COLUMN_COUNT} className="px-0 py-0">
            <div className="bg-gray-50 px-8 py-4 border-y border-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : entries && entries.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        <Trans>Name</Trans>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        <Trans>Position</Trans>
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        <Trans>Compensation</Trans>
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        <Trans>Expenses</Trans>
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        <Trans>Total</Trans>
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        <Trans>Months</Trans>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry, i) => (
                      <tr key={i} className="hover:bg-gray-100">
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {entry.official_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600">
                          {entry.position}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                          {formatCurrency(entry.compensation)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                          {formatCurrency(entry.expenses)}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(entry.row_total)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">
                          {entry.months_in_office !== null
                            ? entry.months_in_office
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  <Trans>No individual entries available.</Trans>
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
});
