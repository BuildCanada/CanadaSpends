import type { SankeyData } from "@/components/Sankey/SankeyChartD3";

const YORK_FACTORY_API_URL = (
  process.env.YORK_FACTORY_API_URL ??
  "https://yorkfactory.buildcanada.com/api/v1"
).replace(/\/$/, "");

export type MunicipalFinancialFact = {
  concept:
    | "total_financial_assets"
    | "total_liabilities"
    | "net_financial_assets"
    | "total_non_financial_assets"
    | "accumulated_surplus"
    | "opening_accumulated_surplus"
    | "total_revenue"
    | "total_expenses"
    | "annual_surplus";
  value: number;
  raw_label: string;
  raw_text: string;
  statement: "financial_position" | "operations" | "accumulated_surplus";
  source_page: number;
  column_year: string;
  confidence: number | null;
};

export type MunicipalStatement = {
  fiscal_year: number;
  fiscal_year_end: string;
  statement_basis: "consolidated" | "non_consolidated";
  language: "en" | "fr" | "bilingual" | null;
  source: {
    document_id: string;
    page_url: string | null;
    download_url: string | null;
  };
  facts: MunicipalFinancialFact[];
  line_items: MunicipalFinancialLineItem[];
  verification?: MunicipalStatementVerification;
  per_capita: Partial<Record<MunicipalFinancialFact["concept"], number>> | null;
  sankey: SankeyData | null;
};

export type MunicipalStatementVerification = {
  status: "approved";
  reviewed_at: string;
  reviewed_by: string;
  review_notes: string | null;
  summary: {
    total: number;
    pass: number;
    skip: number;
    fail: number;
  };
  checks: Array<{
    id: string;
    status: "pass" | "skip" | "fail";
    detail: string;
  }>;
};

export type MunicipalFinancialLineItem = {
  flow: "revenue" | "expense";
  category: string;
  label: string;
  value: number;
  raw_text: string;
  scale: number;
  source_page: number;
  column_year: string;
  position: number;
  confidence: number | null;
};

export type MunicipalityCensusContext = {
  census_year: number | null;
  population: number | null;
  area_sq_km: number | null;
  population_density_per_sq_km: number | null;
  geographies: Array<{
    uid: string;
    name: string;
    population: number | null;
    area_sq_km: number | null;
  }>;
};

export type MunicipalityFinancialSummary = {
  canonical_id: string;
  slug: string;
  province: string;
  province_name: string;
  province_slug: string;
  name: string;
  name_fr: string | null;
  legal_form: string | null;
  website_url: string | null;
  available_years: number[];
  available_periods: Array<{ year: number; fiscal_year_end: string }>;
};

export type MunicipalityFinancialDetail = MunicipalityFinancialSummary & {
  context: MunicipalityCensusContext;
  statements: MunicipalStatement[];
};

export function latestMunicipalFinancialYear(
  municipality:
    | Pick<MunicipalityFinancialSummary, "available_years">
    | null
    | undefined,
): number | null {
  if (!municipality?.available_years.length) return null;

  return Math.max(...municipality.available_years);
}

async function yorkFactoryFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${YORK_FACTORY_API_URL}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new YorkFactoryApiError(response.status);
  }

  return response.json() as Promise<T>;
}

class YorkFactoryApiError extends Error {
  constructor(readonly status: number) {
    super(`York Factory API error: ${status}`);
  }
}

export async function getMunicipalFinancialStatements(): Promise<
  MunicipalityFinancialSummary[]
> {
  const municipalities: MunicipalityFinancialSummary[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const payload = await yorkFactoryFetch<{
      data: MunicipalityFinancialSummary[];
      meta: { total_pages: number };
    }>(`/warehouse/municipal_financial_statements?page=${page}&per_page=5000`);
    municipalities.push(...payload.data);
    totalPages = payload.meta.total_pages;
    page += 1;
  } while (page <= totalPages);
  return municipalities;
}

export async function getMunicipalityFinancialStatements(
  province: string,
  municipality: string,
  year?: string,
): Promise<MunicipalityFinancialDetail | null> {
  const suffix = year ? `/${encodeURIComponent(year)}` : "";

  try {
    return await yorkFactoryFetch<MunicipalityFinancialDetail>(
      `/warehouse/municipal_financial_statements/${encodeURIComponent(province)}/${encodeURIComponent(municipality)}${suffix}`,
    );
  } catch (error) {
    if (error instanceof YorkFactoryApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
