"use client";

import { useInflation, useInflationScale } from "@/components/InflationContext";
import type { FederalTransferPayment } from "@/lib/federal";
import { cn } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// LineItemTable — searchable, sortable, paginated table of transfer-payment
// (grant/contribution) lines. Figures are shown in dollars (not billions).
// Includes a client-side CSV download. Authorities (votes/allotments) were
// dropped from department pages (drop-authorities spec §1), so this is now the
// transfer-payments view only; it also names the programs behind the transfer
// object in the mini Sankey above it.
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

type Column = {
  key: string;
  label: string;
  numeric?: boolean;
  get: (row: Record<string, unknown>) => string | number;
};

function formatDollars(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function downloadCsv(
  filename: string,
  columns: Column[],
  rows: Record<string, unknown>[],
) {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(c.get(row))).join(","))
    .join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function LineItemTable({
  transferPayments,
  slug,
  year,
}: {
  transferPayments: FederalTransferPayment[];
  slug: string;
  year: number;
}) {
  const { t, i18n } = useLingui();
  const { real, baseYear } = useInflation();
  const scale = useInflationScale();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("used");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const money = (v: number) => formatDollars(v, i18n.locale);
  // In real mode, dollar columns (table AND the CSV, which reads the same
  // column definitions) are scaled and labeled with the CPI base year.
  const realSuffix = real ? ` (${t`real`} ${baseYear} $)` : "";

  const columns: Column[] = useMemo(
    () => [
      {
        key: "category",
        label: t`Category`,
        get: (r) => (r.category as string) ?? "",
      },
      {
        key: "description",
        label: t`Description`,
        get: (r) => (r.description as string) ?? "",
      },
      {
        key: "used",
        label: t`Amount` + realSuffix,
        numeric: true,
        get: (r) => Math.round(((r.used as number) ?? 0) * scale),
      },
    ],
    [t, realSuffix, scale],
  );

  const rawRows = transferPayments as unknown as Record<string, unknown>[];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = rawRows;
    if (q) {
      filtered = rawRows.filter((row) =>
        columns.some((c) => String(c.get(row)).toLowerCase().includes(q)),
      );
    }
    const col = columns.find((c) => c.key === sortKey) ?? columns[0];
    const sorted = [...filtered].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rawRows, columns, query, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  const handleSort = (key: string) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-card px-3 py-1 text-sm font-medium text-foreground/80">
          <Trans>Transfer payments</Trans>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={t`Search line items…`}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm w-48 md:w-64"
          />
          <button
            type="button"
            onClick={() =>
              downloadCsv(`${slug}-${year}-transfers.csv`, columns, rows)
            }
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
          >
            <Trans>Download CSV</Trans>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className={cn(
                    "px-3 py-2 font-semibold text-foreground/70 cursor-pointer select-none whitespace-nowrap",
                    c.numeric ? "text-right" : "text-left",
                  )}
                >
                  {c.label}
                  {sortKey === c.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-3 py-2 align-top",
                      c.numeric
                        ? "text-right tabular-nums whitespace-nowrap"
                        : "text-left",
                    )}
                  >
                    {c.numeric
                      ? money(c.get(row) as number)
                      : (c.get(row) as string)}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-foreground/50"
                >
                  <Trans>No matching line items.</Trans>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3 text-sm text-foreground/60">
        <span>
          {real ? (
            <Trans>
              {rows.length} line items · all figures in real {baseYear} dollars
            </Trans>
          ) : (
            <Trans>{rows.length} line items · all figures in dollars</Trans>
          )}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-40"
            >
              <Trans>Prev</Trans>
            </button>
            <span>
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-md border border-gray-300 px-2 py-1 disabled:opacity-40"
            >
              <Trans>Next</Trans>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
