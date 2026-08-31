"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plural, Trans, useLingui } from "@lingui/react/macro";
import type { MunicipalityFinancialSummary } from "@/lib/municipal-financial-statements";

export function MunicipalFinancialStatementsSearch({
  municipalities,
  lang,
}: {
  municipalities: MunicipalityFinancialSummary[];
  lang: string;
}) {
  const { t } = useLingui();
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("");
  const provinces = useMemo(
    () =>
      Array.from(
        new Map(
          municipalities.map((municipality) => [
            municipality.province,
            municipality.province_name,
          ]),
        ),
      ).sort((a, b) => a[1].localeCompare(b[1])),
    [municipalities],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return municipalities.filter(
      (municipality) =>
        (!province || municipality.province === province) &&
        (!normalizedQuery ||
          municipality.name.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [municipalities, province, query]);

  return (
    <div>
      <div className="mb-8 grid gap-3 md:grid-cols-[minmax(0,1fr)_18rem]">
        <label>
          <span className="sr-only">
            <Trans>Search municipalities</Trans>
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t`Search municipalities`}
            className="block w-full border border-gray-300 px-4 py-3 focus:border-auburn-500 focus:outline-none focus:ring-2 focus:ring-auburn-500"
          />
        </label>
        <label>
          <span className="sr-only">
            <Trans>Filter by province or territory</Trans>
          </span>
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            className="block w-full border border-gray-300 bg-white px-4 py-3 focus:border-auburn-500 focus:outline-none focus:ring-2 focus:ring-auburn-500"
          >
            <option value="">
              <Trans>All provinces and territories</Trans>
            </option>
            {provinces.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 text-sm text-gray-600">
        <Plural
          value={filtered.length}
          one="# municipality with reviewed financial data"
          other="# municipalities with reviewed financial data"
        />
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((municipality) => {
          const latestYear = Math.max(...municipality.available_years);
          const earliestYear = Math.min(...municipality.available_years);
          return (
            <Link
              key={municipality.canonical_id}
              href={`/${lang}/municipal/${municipality.province_slug}/${municipality.slug}/${latestYear}`}
              className="border border-gray-200 bg-white p-5 shadow-sm transition hover:border-auburn-700 hover:shadow-md"
            >
              <span className="block text-lg font-semibold text-auburn-700">
                {municipality.name}
              </span>
              <span className="mt-1 block text-sm text-gray-600">
                {municipality.province_name}
                {municipality.legal_form ? ` · ${municipality.legal_form}` : ""}
              </span>
              <span className="mt-4 block text-sm font-medium text-gray-800">
                {municipality.available_years.length === 1 ? (
                  <Trans>{latestYear} financial statements</Trans>
                ) : (
                  <>
                    <Plural
                      value={municipality.available_years.length}
                      one="# year"
                      other="# years"
                    />{" "}
                    · {earliestYear}–{latestYear}
                  </>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="border border-gray-200 p-8 text-center text-gray-600">
          <Trans>No municipalities match those filters.</Trans>
        </p>
      )}
    </div>
  );
}
