"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Trans } from "@lingui/react/macro";
import { Search } from "lucide-react";
import type { BandInfo } from "@/lib/supabase/types";

interface BandSearchProps {
  bands: BandInfo[];
  lang: string;
}

export function BandSearch({ bands, lang }: BandSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBands = useMemo(() => {
    if (!searchQuery.trim()) {
      return bands;
    }

    const query = searchQuery.toLowerCase();
    return bands.filter((band) => band.name.toLowerCase().includes(query));
  }, [bands, searchQuery]);

  return (
    <div>
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search First Nations bands..."
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
        />
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {searchQuery ? (
          <Trans>
            Showing {filteredBands.length} of {bands.length} bands
          </Trans>
        ) : (
          <Trans>{bands.length} First Nations bands with financial data</Trans>
        )}
      </div>

      {filteredBands.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            <Trans>No bands found matching your search.</Trans>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBands.map((band) => (
            <BandCard key={band.bcid} band={band} lang={lang} />
          ))}
        </div>
      )}
    </div>
  );
}

function BandCard({ band, lang }: { band: BandInfo; lang: string }) {
  const latestYear = band.availableYears[0];
  const chunkTypes = latestYear
    ? band.availableChunkTypes[latestYear] || []
    : [];
  const hasData = band.availableYears.length > 0;

  return (
    <Link
      href={`/${lang}/first-nations/${band.bcid}`}
      className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
    >
      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
        {band.name}
      </h3>
      <div className="text-sm text-gray-600 space-y-1">
        {hasData ? (
          <>
            <p>
              <Trans>Years available:</Trans> {band.availableYears.length}
            </p>
            <p className="text-xs text-gray-500">
              <Trans>Latest:</Trans> {formatFiscalYear(latestYear)}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {chunkTypes.includes("statement_of_operations") && (
                <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                  <Trans>Operations</Trans>
                </span>
              )}
              {chunkTypes.includes("remuneration") && (
                <span className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                  <Trans>Remuneration</Trans>
                </span>
              )}
              {chunkTypes.includes("statement_of_financial_position") && (
                <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                  <Trans>Position</Trans>
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-400 italic">
            <Trans>No financial data available yet</Trans>
          </p>
        )}
      </div>
    </Link>
  );
}

function formatFiscalYear(year: string | undefined): string {
  if (!year) return "N/A";
  if (year.includes("-")) {
    const date = new Date(year);
    const endYear = date.getFullYear();
    const month = date.getMonth();

    if (month <= 2) {
      const startYear = endYear - 1;
      return `FY ${startYear}-${String(endYear).slice(-2)}`;
    } else {
      const nextYear = endYear + 1;
      return `FY ${endYear}-${String(nextYear).slice(-2)}`;
    }
  }

  return `FY ${year}`;
}
