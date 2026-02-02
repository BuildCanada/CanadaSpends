// Types for First Nations band data from Supabase API

// API response type for extraction_availability (one row per band)
export interface ExtractionAvailabilityResponse {
  bcid: string;
  name: string;
  entity_type: string;
  province: string;
  fiscal_years: number[];
  chunk_types_by_year: Record<string, string[]>;
}

// Internal type used by components
export interface BandInfo {
  bcid: string;
  name: string;
  province?: string;
  availableYears: string[];
  availableChunkTypes: Record<string, string[]>; // year -> chunk_types
}

// Statement of Operations types (actual API structure)
export interface LineItemValues {
  actual_2023?: number | null;
  actual_2024?: number | null;
  budget_2024?: number | null;
  [key: string]: number | null | undefined;
}

export interface StatementLineItem {
  name: string;
  values: LineItemValues;
  section: string | null;
  is_total: boolean;
  is_subtotal: boolean;
  is_calculated: boolean;
  major_category: string;
  parent_category?: string | null;
  note_references?: string | null;
}

export interface FiscalPeriod {
  year: number;
  is_budget: boolean;
  column_header: string;
}

export interface StatementOfOperations {
  entity: string;
  currency: string;
  line_items: StatementLineItem[];
  period_ending: string;
  fiscal_periods: FiscalPeriod[];
  statement_type: string;
  extraction_metadata?: Record<string, unknown>;
  numbers_in_parentheses_are_negative?: boolean;
}

// Remuneration types (actual API structure)
export interface RemunerationColumn {
  header: string;
  category: string;
  normalized_key: string;
}

export interface RemunerationValues {
  salary?: number;
  honorarium?: number;
  contract?: number;
  travel?: number;
  other?: number;
  [key: string]: number | undefined;
}

export interface RemunerationEntry {
  name: string;
  position: string;
  months?: number;
  values: RemunerationValues;
  row_total: number;
  is_collective_expense: boolean;
}

export interface RemunerationNote {
  content: string;
  subject: string;
}

export interface Remuneration {
  notes?: RemunerationNote[];
  columns: RemunerationColumn[];
  context?: string;
  entries: RemunerationEntry[];
  band_name: string;
  is_audited: boolean;
  auditor_name?: string;
  column_totals?: Record<string, number>;
  fiscal_year_end: string;
  extraction_metadata?: Record<string, unknown>;
}

// Statement of Financial Position types
export interface FinancialPositionLineItem {
  name: string;
  values: LineItemValues;
  section: string | null;
  is_total: boolean;
  is_subtotal: boolean;
  major_category: string;
  parent_category?: string | null;
}

export interface StatementOfFinancialPosition {
  entity: string;
  currency: string;
  line_items: FinancialPositionLineItem[];
  period_ending: string;
  fiscal_periods: FiscalPeriod[];
  statement_type: string;
  extraction_metadata?: Record<string, unknown>;
}

// Notes types
export interface NoteEntry {
  title?: string;
  content?: string;
  note_number?: number;
  subject?: string;
}

export interface Notes {
  notes: NoteEntry[];
}

export interface AnnualReportExtraction {
  id: string;
  bcid: string;
  first_nation_name: string;
  fiscal_year_end: number;
  chunk_type: string;
  extracted_data:
    | StatementOfOperations
    | StatementOfFinancialPosition
    | Remuneration
    | Notes;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
