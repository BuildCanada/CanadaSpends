"use client";

import type { FederalTransferPayment, FederalVoteLine } from "@/lib/federal";
import { cn } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import { useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// LineItemTable — searchable, sortable, paginated table of appropriation
// (vote/allotment) lines and transfer-payment lines. Figures are shown in
// dollars (not billions). Includes a client-side CSV download. Backs the
// top-N + "Other" truncation in the mini Sankey above it (spec §10).
// ---------------------------------------------------------------------------

const PAGE_SIZE = 15;

type Tab = "votes" | "transfers";

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
  votes,
  transferPayments,
  slug,
  year,
}: {
  votes: FederalVoteLine[];
  transferPayments: FederalTransferPayment[];
  slug: string;
  year: number;
}) {
  const { t, i18n } = useLingui();
  const [tab, setTab] = useState<Tab>("votes");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("used");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const money = (v: number) => formatDollars(v, i18n.locale);

  const voteColumns: Column[] = [
    { key: "vote", label: t`Vote`, get: (r) => (r.vote as string) ?? "" },
    {
      key: "description",
      label: t`Description`,
      get: (r) => (r.description as string) ?? "",
    },
    {
      key: "totalAvailable",
      label: t`Total available`,
      numeric: true,
      get: (r) => (r.totalAvailable as number) ?? 0,
    },
    {
      key: "used",
      label: t`Used`,
      numeric: true,
      get: (r) => (r.used as number) ?? 0,
    },
    {
      key: "lapsed",
      label: t`Lapsed`,
      numeric: true,
      get: (r) => (r.lapsed as number) ?? 0,
    },
  ];

  const transferColumns: Column[] = [
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
      label: t`Amount`,
      numeric: true,
      get: (r) => (r.used as number) ?? 0,
    },
  ];

  const columns = tab === "votes" ? voteColumns : transferColumns;
  const rawRows = (tab === "votes"
    ? votes
    : transferPayments) as unknown as Record<string, unknown>[];

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

  const switchTab = (next: Tab) => {
    setTab(next);
    setQuery("");
    setPage(0);
    setSortKey(next === "votes" ? "used" : "used");
    setSortDir("desc");
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-card p-1 text-sm">
          <button
            type="button"
            onClick={() => switchTab("votes")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              tab === "votes"
                ? "bg-auburn-800 text-white"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            <Trans>Votes &amp; allotments</Trans>
          </button>
          <button
            type="button"
            onClick={() => switchTab("transfers")}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              tab === "transfers"
                ? "bg-auburn-800 text-white"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            <Trans>Transfer payments</Trans>
          </button>
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
              downloadCsv(`${slug}-${year}-${tab}.csv`, columns, rows)
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
          <Trans>{rows.length} line items · all figures in dollars</Trans>
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
