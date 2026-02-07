/**
 * Data fetching for StatsCan data via the Supabase REST API.
 *
 * Queries the `statscan` schema using the Accept-Profile header.
 * All data is public (read-only, no auth needed beyond the API key).
 */

const BASE_URL = "https://api.buildcanada.com/rest/v1";
const API_KEY = "sb_publishable_nDRd3MFmMdzRsDfAkDPc3g_xWbSiV19";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CensusCharacteristic {
  characteristic_id: number;
  characteristic_name: string;
  value: number | null;
  symbol: string | null;
  uom: string | null;
  coordinate_text: string;
}

export interface CubeSliceRow {
  ref_date: string;
  dguid: string | null;
  geo_name: string | null;
  coordinate_text: string;
  value: number | null;
  uom: string | null;
  dimension_values: Record<string, string>;
}

export interface GeoComparison {
  dguid: string;
  geo_name: string;
  value: number | null;
  symbol: string | null;
}

export interface CubeInfo {
  product_id: number;
  title_en: string;
  num_dimensions: number;
  frequency: string | null;
  row_count: number | null;
  loaded_at: string | null;
}

export interface DimensionMember {
  dimension_position: number;
  dimension_name: string;
  member_id: number;
  member_name: string;
  parent_member_id: number | null;
}

export interface Geography {
  dguid: string;
  name_en: string;
  name_fr: string | null;
  geo_level: string;
  alt_geo_code: string | null;
  province_code: string | null;
}

// ── Fetch helper ────────────────────────────────────────────────────────────

async function statscanFetch<T>(
  endpoint: string,
  options?: { revalidate?: number },
): Promise<T> {
  const revalidate = options?.revalidate ?? 3600;
  const url = `${BASE_URL}/${endpoint}`;

  const response = await fetch(url, {
    headers: {
      apikey: API_KEY,
      "Accept-Profile": "statscan",
      "Content-Type": "application/json",
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(
      `StatsCan API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

async function statscanRpc<T>(
  functionName: string,
  params: Record<string, unknown>,
  options?: { revalidate?: number },
): Promise<T> {
  const revalidate = options?.revalidate ?? 3600;
  const url = `${BASE_URL}/rpc/${functionName}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: API_KEY,
      "Accept-Profile": "statscan",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(
      `StatsCan RPC error: ${response.status} ${response.statusText} (${functionName})`,
    );
  }

  return response.json();
}

// ── Census Profile ──────────────────────────────────────────────────────────

/**
 * Get the full census profile for a geography.
 * Returns ~2,600 characteristics (population, demographics, housing, etc.)
 */
export async function getCensusProfile(
  dguid: string,
  refDate: string = "2021",
): Promise<CensusCharacteristic[]> {
  return statscanRpc<CensusCharacteristic[]>("census_profile", {
    p_dguid: dguid,
    p_ref_date: refDate,
  });
}

// ── Cube Slicing ────────────────────────────────────────────────────────────

/**
 * Slice a cube by dimension member names.
 *
 * @param productId - StatsCan product ID (e.g., 98100001)
 * @param filters - Dimension filters: { "Geography": "Ontario", "Sex": "Both sexes" }
 * @param refDate - Reference date to filter by (optional)
 * @param limit - Max rows to return (default 1000)
 * @param offset - Pagination offset
 */
export async function sliceCube(
  productId: number,
  filters: Record<string, string> = {},
  refDate?: string,
  limit: number = 1000,
  offset: number = 0,
): Promise<CubeSliceRow[]> {
  return statscanRpc<CubeSliceRow[]>("slice_cube", {
    p_product_id: productId,
    p_filters: filters,
    p_ref_date: refDate ?? null,
    p_limit: limit,
    p_offset: offset,
  });
}

// ── Geography Comparisons ───────────────────────────────────────────────────

/**
 * Compare a characteristic across geographies.
 *
 * @param productId - StatsCan product ID
 * @param characteristic - Exact characteristic name from the cube
 * @param geoLevel - Geographic level: 'Province/territory', 'Census metropolitan area', etc.
 * @param refDate - Reference date (default '2021')
 */
export async function compareGeographies(
  productId: number,
  characteristic: string,
  geoLevel: string = "Province/territory",
  refDate: string = "2021",
): Promise<GeoComparison[]> {
  return statscanRpc<GeoComparison[]>("compare_geographies", {
    p_product_id: productId,
    p_characteristic: characteristic,
    p_geo_level: geoLevel,
    p_ref_date: refDate,
  });
}

// ── Cube Metadata ───────────────────────────────────────────────────────────

/** List all loaded cubes */
export async function listCubes(): Promise<CubeInfo[]> {
  return statscanRpc<CubeInfo[]>("list_cubes", {});
}

/** Get dimension tree for a cube (all dimensions and their members) */
export async function getCubeDimensions(
  productId: number,
): Promise<DimensionMember[]> {
  return statscanRpc<DimensionMember[]>("cube_dimensions", {
    p_product_id: productId,
  });
}

// ── Geography Queries ───────────────────────────────────────────────────────

/** Search geographies by name */
export async function searchGeographies(
  queryText: string,
  geoLevel?: string,
  limit: number = 50,
): Promise<Geography[]> {
  return statscanRpc<Geography[]>("search_geographies", {
    p_query: queryText,
    p_geo_level: geoLevel ?? null,
    p_limit: limit,
  });
}

/** Get all geographies at a specific level */
export async function getGeographiesByLevel(
  geoLevel: string,
): Promise<Geography[]> {
  return statscanFetch<Geography[]>(
    `geographies?geo_level=eq.${encodeURIComponent(geoLevel)}&order=name_en`,
  );
}

/** Get a single geography by DGUID */
export async function getGeography(dguid: string): Promise<Geography | null> {
  const results = await statscanFetch<Geography[]>(
    `geographies?dguid=eq.${encodeURIComponent(dguid)}`,
  );
  return results[0] ?? null;
}
