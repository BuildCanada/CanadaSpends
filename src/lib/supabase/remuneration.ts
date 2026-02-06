// Data fetching functions for Band Remuneration overview

import { supabaseFetch } from "./index";

// API response type for band_remuneration_summary
export interface BandRemunerationSummary {
  bcid: string;
  band_name: string;
  province: string;
  fiscal_year_end: number;
  validation_status: string;
  confidence_score: number;
  is_audited: boolean;
  auditor_name: string | null;
  officials_count: number;
  total_remuneration: number;
  total_compensation: number;
  total_expenses: number;
  chief_total: number | null;
  chief_compensation: number | null;
  chief_name: string | null;
  avg_councillor_total: number | null;
  pop_on_reserve_total: number | null;
  pop_total: number | null;
  remuneration_per_capita_on_reserve: number | null;
  remuneration_per_capita_total: number | null;
  compensation_per_capita_on_reserve: number | null;
  compensation_per_capita_total: number | null;
  source_pdf_r2_path: string | null;
}

// API response type for remuneration_entries
export interface RemunerationEntryRow {
  extraction_id: number;
  bcid: string;
  band_name: string;
  province: string;
  fiscal_year_end: number;
  validation_status: string;
  confidence_score: number;
  is_audited: boolean;
  auditor_name: string | null;
  official_name: string;
  position: string;
  months_in_office: number | null;
  row_total: number;
  compensation: number;
  expenses: number;
  compensation_detail: Record<string, number> | null;
  entry_index: number;
}

const PAGE_SIZE = 1000;

/**
 * Get remuneration summary for all bands, paginating through all results.
 * Supabase REST API returns at most 1000 rows per request.
 */
export async function getBandRemunerationSummary(
  year?: number,
): Promise<BandRemunerationSummary[]> {
  const allResults: BandRemunerationSummary[] = [];
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let endpoint = `band_remuneration_summary?order=total_remuneration.desc&limit=${PAGE_SIZE}&offset=${offset}`;
    if (year) {
      endpoint += `&fiscal_year_end=eq.${year}`;
    }
    const page = await supabaseFetch<BandRemunerationSummary[]>(endpoint);
    allResults.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return allResults;
}

/**
 * Get individual remuneration entries for a specific band and year.
 * Used client-side for expandable row detail.
 */
export async function getRemunerationEntries(
  bcid: string,
  year: number,
): Promise<RemunerationEntryRow[]> {
  return supabaseFetch<RemunerationEntryRow[]>(
    `remuneration_entries?bcid=eq.${encodeURIComponent(bcid)}&fiscal_year_end=eq.${year}&order=entry_index.asc`,
  );
}

/**
 * Get all remuneration entries for a specific band across all years.
 */
export async function getRemunerationEntriesByBand(
  bcid: string,
): Promise<RemunerationEntryRow[]> {
  return supabaseFetch<RemunerationEntryRow[]>(
    `remuneration_entries?bcid=eq.${encodeURIComponent(bcid)}&order=fiscal_year_end.desc,entry_index.asc`,
  );
}

/**
 * Get remuneration summary rows for a specific band across all years.
 */
export async function getBandRemunerationSummaryByBcid(
  bcid: string,
): Promise<BandRemunerationSummary[]> {
  return supabaseFetch<BandRemunerationSummary[]>(
    `band_remuneration_summary?bcid=eq.${encodeURIComponent(bcid)}&order=fiscal_year_end.desc`,
  );
}
