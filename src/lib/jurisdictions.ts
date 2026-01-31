import { SankeyData } from "@/components/Sankey/SankeyChartD3";
import fs from "fs";
import path from "path";
import { provinceNames } from "./provinceNames";

const dataDir = path.join(process.cwd(), "data");

// ============================================================================
// STATIC DATA LOADING (Internal)
// ============================================================================

/**
 * Type definition for the static data structure
 */
type StaticData = {
  _disclaimer: string;
  fileStats: Record<string, string>;
  structure: {
    provincial: Record<
      string,
      { years: string[]; departmentsByYear: Record<string, string[]> }
    >;
    municipal: Record<
      string,
      Record<
        string,
        { years: string[]; departmentsByYear: Record<string, string[]> }
      >
    >;
    articles: {
      en: string[];
      fr: string[];
    };
  };
};

/**
 * Cached static data to avoid repeated file reads
 */
let cachedStaticData: StaticData | null = null;

/**
 * Load and cache static data from data/static-data.json
 * Internal function - consumers should use the public API functions below
 */
function loadStaticData(): StaticData {
  if (!cachedStaticData) {
    const staticDataPath = path.join(process.cwd(), "data", "static-data.json");
    if (fs.existsSync(staticDataPath)) {
      cachedStaticData = JSON.parse(
        fs.readFileSync(staticDataPath, "utf8"),
      ) as StaticData;
    } else {
      // Fallback to empty structure if file doesn't exist
      cachedStaticData = {
        _disclaimer: "",
        fileStats: {},
        structure: {
          provincial: {},
          municipal: {},
          articles: { en: [], fr: [] },
        },
      };
    }
  }
  return cachedStaticData;
}

// ============================================================================
// PUBLIC API - JURISDICTION QUERIES
// ============================================================================

/**
 * Find the latest year folder in a jurisdiction directory that contains summary.json.
 * Uses static-data.json for faster performance.
 * Returns the year string (e.g., "2024") or null if no valid year folders found.
 */
function findLatestYear(jurisdictionPath: string): string | null {
  const years = getAvailableYears(jurisdictionPath);
  return years.length > 0 ? years[0] : null;
}

/**
 * Get the path to the data files for a jurisdiction (in the latest year folder).
 * Falls back to the jurisdiction path directly if no year folders exist (backward compatibility).
 */
function getJurisdictionDataPath(jurisdictionPath: string): string {
  const latestYear = findLatestYear(jurisdictionPath);
  if (latestYear) {
    return path.join(jurisdictionPath, latestYear);
  }
  // Fallback: return the jurisdiction path directly (for backward compatibility)
  return jurisdictionPath;
}

/**
 * Get available years for a jurisdiction path.
 * Uses static-data.json for faster performance instead of filesystem lookups.
 * Returns an array of year strings (e.g., ["2024", "2023"]) sorted descending.
 *
 * @internal Used by generateStaticParams in page components
 */
export function getAvailableYears(jurisdictionPath: string): string[] {
  const staticData = loadStaticData();

  // Parse the jurisdiction path to extract province/municipality
  // Path format: data/provincial/{province} or data/municipal/{province}/{municipality}
  const normalizedPath = path.normalize(jurisdictionPath);
  const pathParts = normalizedPath.split(path.sep);

  // Find the index of "provincial" or "municipal" in the path
  const provincialIndex = pathParts.indexOf("provincial");
  const municipalIndex = pathParts.indexOf("municipal");

  if (provincialIndex !== -1 && provincialIndex + 1 < pathParts.length) {
    // Provincial jurisdiction
    const province = pathParts[provincialIndex + 1];
    const provinceData = staticData.structure.provincial[province];
    if (provinceData?.years) {
      // Return years sorted descending (they should already be sorted, but ensure it)
      return [...provinceData.years].sort(
        (a, b) => parseInt(b, 10) - parseInt(a, 10),
      );
    }
  } else if (municipalIndex !== -1 && municipalIndex + 2 < pathParts.length) {
    // Municipal jurisdiction
    const province = pathParts[municipalIndex + 1];
    const municipality = pathParts[municipalIndex + 2];
    const municipalityData =
      staticData.structure.municipal[province]?.[municipality];
    if (municipalityData?.years) {
      // Return years sorted descending
      return [...municipalityData.years].sort(
        (a, b) => parseInt(b, 10) - parseInt(a, 10),
      );
    }
  }

  // Fallback to empty array if not found in static data
  return [];
}

/**
 * Find the data path for a jurisdiction slug with optional year.
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param year - Optional year string (e.g., "2024") or null for latest
 * @returns The data path to the jurisdiction's data folder, or null if not found
 */
function findJurisdictionDataPathWithYear(
  jurisdiction: string,
  year: string | null = null,
): string | null {
  const parts = jurisdiction.split("/");
  let basePath: string | null = null;

  if (parts.length === 1) {
    // Could be a province or a municipality - check both
    const provincialPath = path.join(dataDir, "provincial", jurisdiction);
    if (fs.existsSync(provincialPath)) {
      basePath = provincialPath;
    } else {
      // It's likely a municipality - search for it
      const municipalDir = path.join(dataDir, "municipal");
      if (fs.existsSync(municipalDir)) {
        const provinces = fs.readdirSync(municipalDir).filter((f) => {
          const provincePath = path.join(municipalDir, f);
          return fs.statSync(provincePath).isDirectory();
        });

        for (const province of provinces) {
          const municipalityPath = path.join(
            municipalDir,
            province,
            jurisdiction,
          );
          if (fs.existsSync(municipalityPath)) {
            basePath = municipalityPath;
            break;
          }
        }
      }
    }
  } else if (parts.length === 2) {
    // Municipal jurisdiction with explicit province
    const [province, municipality] = parts;
    const municipalityPath = path.join(
      dataDir,
      "municipal",
      province,
      municipality,
    );
    if (fs.existsSync(municipalityPath)) {
      basePath = municipalityPath;
    }
  }

  if (!basePath) {
    return null;
  }

  // If year is specified, use it; otherwise use latest year
  if (year) {
    const yearPath = path.join(basePath, year);
    if (fs.existsSync(path.join(yearPath, "summary.json"))) {
      return yearPath;
    }
    return null;
  }

  // Use latest year
  return getJurisdictionDataPath(basePath);
}

/**
 * Get available years for a jurisdiction slug.
 * Uses static-data.json for faster performance.
 * Returns an array of year strings (e.g., ["2024", "2023"]) sorted descending.
 *
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @returns Array of year strings, sorted descending, or empty array if not found
 */
export function getAvailableYearsForJurisdiction(
  jurisdiction: string,
): string[] {
  const staticData = loadStaticData();
  const parts = jurisdiction.split("/");

  if (parts.length === 1) {
    // Check if it's a province
    const provinceData = staticData.structure.provincial[jurisdiction];
    if (provinceData?.years?.length > 0) {
      // Years are already sorted descending in static data
      return [...provinceData.years];
    }

    // Check if it's a municipality (search across all provinces)
    for (const province of Object.keys(staticData.structure.municipal)) {
      const municipalityData =
        staticData.structure.municipal[province]?.[jurisdiction];
      if (municipalityData?.years?.length > 0) {
        return [...municipalityData.years];
      }
    }
  } else if (parts.length === 2) {
    // Municipal jurisdiction with explicit province
    const [province, municipality] = parts;
    const municipalityData =
      staticData.structure.municipal[province]?.[municipality];
    if (municipalityData?.years?.length > 0) {
      return [...municipalityData.years];
    }
  }

  return [];
}

/**
 * Get the latest year for a jurisdiction.
 * Uses static-data.json for faster performance.
 *
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @returns The latest year string or null if not found
 * @internal Used internally by non-year jurisdiction pages
 */
function getLatestYearForJurisdiction(jurisdiction: string): string | null {
  const years = getAvailableYearsForJurisdiction(jurisdiction);
  return years.length > 0 ? years[0] : null;
}

export type Jurisdiction = {
  slug: string;
  name: string;
  financialYear: string;
  totalEmployees?: number;
  totalProvincialSpendingFormatted: string;
  totalProvincialSpending: number;
  total: number;
  source: string;
  sources?: Array<{
    label: string;
    url: string;
    scope?: string;
  }>;
  // Optional list of ministries from summary.json; used for fallback counts
  ministries?: unknown[];
  debtInterest: number;
  netDebt: number;
  totalDebt: number;
  methodology?: string;
  credits?: string;
};

type Category = {
  name: string;
  amount: number;
};

export type Department = {
  slug: string;
  name: string;
  totalSpending: number;
  totalSpendingFormatted: string;
  percentage: number;
  percentageFormatted: string;
  categories: Category[];
  spending_data: {
    name: string;
    children: Category[];
  };
  generatedAt: string;
  // Editable content fields
  introText: string;
  descriptionText: string;
  roleText: string;
  programsHeading: string;
  programsDescription: string;
  leadershipHeading?: string;
  leadershipDescription?: string;
  prioritiesHeading?: string;
  prioritiesDescription?: string;
  agenciesHeading?: string;
  agenciesDescription?: string;
  budgetHeading?: string;
  budgetDescription?: string;
  budgetProjectionsText?: string;
};

type Data = {
  jurisdiction: Jurisdiction;
  sankey: SankeyData;
};

/**
 * Get all provincial jurisdiction slugs.
 * Returns provinces that have data available, sorted alphabetically.
 * Uses static-data.json internally for faster performance.
 *
 * @example
 * const provinces = getProvincialSlugs();
 * // ["alberta", "british-columbia", "ontario"]
 */
export function getProvincialSlugs(): string[] {
  const staticData = loadStaticData();
  return Object.keys(staticData.structure.provincial).sort();
}

/**
 * Get all municipalities grouped by their province.
 * Each municipality includes its slug and display name.
 * Uses static-data.json internally for structure, reads summary.json for names.
 *
 * @returns Array of provinces with their municipalities
 * @example
 * const data = getMunicipalitiesByProvince();
 * // [
 * //   { province: "ontario", municipalities: [{ slug: "toronto", name: "Toronto" }] },
 * //   { province: "british-columbia", municipalities: [{ slug: "vancouver", name: "Vancouver" }] }
 * // ]
 */
export function getMunicipalitiesByProvince(): Array<{
  province: string;
  municipalities: Array<{ slug: string; name: string }>;
}> {
  const staticData = loadStaticData();
  const result: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }> = [];

  for (const province of Object.keys(staticData.structure.municipal)) {
    const municipalitySlugs = Object.keys(
      staticData.structure.municipal[province] || {},
    );

    const municipalities = municipalitySlugs
      .map((slug) => {
        // Try to get the name from summary.json, fallback to slug
        const municipalityPath = path.join(
          dataDir,
          "municipal",
          province,
          slug,
        );
        const dataPath = getJurisdictionDataPath(municipalityPath);
        const summaryPath = path.join(dataPath, "summary.json");
        let name = slug;
        try {
          const summaryData = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
          name = summaryData.name || slug;
        } catch {
          // Fallback to slug if we can't read the file
        }
        return { slug, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (municipalities.length > 0) {
      result.push({ province, municipalities });
    }
  }

  // Sort provinces alphabetically by name
  return result.sort((a, b) => {
    const nameA = provinceNames[a.province] || a.province;
    const nameB = provinceNames[b.province] || b.province;
    return nameA.localeCompare(nameB);
  });
}

/**
 * Get jurisdiction data, supporting both provincial and municipal paths.
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param year - Optional year string (e.g., "2024") or null for latest
 * @throws Error if jurisdiction data is not found
 */
export function getJurisdictionData(
  jurisdiction: string,
  year: string | null = null,
): Data {
  const parts = jurisdiction.split("/");
  const jurisdictionPath = findJurisdictionDataPathWithYear(jurisdiction, year);

  if (!jurisdictionPath) {
    throw new Error(
      `Jurisdiction data not found: ${jurisdiction}${year ? ` for year ${year}` : ""}`,
    );
  }

  const summaryPath = path.join(jurisdictionPath, "summary.json");
  const sankeyPath = path.join(jurisdictionPath, "sankey.json");

  if (!fs.existsSync(summaryPath)) {
    throw new Error(`Jurisdiction data not found: ${jurisdiction}`);
  }

  if (!fs.existsSync(sankeyPath)) {
    throw new Error(`Sankey data not found for jurisdiction: ${jurisdiction}`);
  }

  try {
    const jurisdictionData = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    const sankeyData = JSON.parse(fs.readFileSync(sankeyPath, "utf8"));

    return {
      jurisdiction: { slug: parts[parts.length - 1], ...jurisdictionData },
      sankey: sankeyData,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse data files for jurisdiction ${jurisdiction}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get department data for a specific jurisdiction and department.
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param department - Department slug
 * @param year - Optional year string (e.g., "2024") or null for latest
 * @throws Error if jurisdiction or department data is not found
 */
export function getDepartmentData(
  jurisdiction: string,
  department: string,
  year: string | null = null,
): Department {
  const jurisdictionPath = findJurisdictionDataPathWithYear(jurisdiction, year);

  if (!jurisdictionPath) {
    throw new Error(`Jurisdiction data not found: ${jurisdiction}`);
  }

  const departmentPath = path.join(
    jurisdictionPath,
    "departments",
    `${department}.json`,
  );

  if (!fs.existsSync(departmentPath)) {
    throw new Error(
      `Department data not found: ${department} for jurisdiction ${jurisdiction}`,
    );
  }

  try {
    const departmentData: Omit<Department, "slug"> = JSON.parse(
      fs.readFileSync(departmentPath, "utf8"),
    );

    return {
      slug: department,
      ...departmentData,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse department data for ${department} in ${jurisdiction}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get list of department slugs for a jurisdiction.
 * Uses static-data.json for faster performance when year is provided.
 * Returns empty array if jurisdiction not found or has no departments (non-throwing).
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param year - Optional year string (e.g., "2024") or null for latest
 * @returns Array of department slugs, or empty array if none found
 */
export function getDepartmentsForJurisdiction(
  jurisdiction: string,
  year: string | null = null,
): string[] {
  const staticData = loadStaticData();
  const parts = jurisdiction.split("/");

  // Determine the year to use
  const targetYear = year || getLatestYearForJurisdiction(jurisdiction);
  if (!targetYear) {
    return [];
  }

  // Try to get departments from static data
  if (parts.length === 1) {
    // Check provincial first
    const provinceData = staticData.structure.provincial[jurisdiction];
    if (provinceData?.departmentsByYear?.[targetYear]) {
      return provinceData.departmentsByYear[targetYear];
    }

    // Check if it's a municipality (search across all provinces)
    for (const province of Object.keys(staticData.structure.municipal)) {
      const municipalityData =
        staticData.structure.municipal[province]?.[jurisdiction];
      if (municipalityData?.departmentsByYear?.[targetYear]) {
        return municipalityData.departmentsByYear[targetYear];
      }
    }
  } else if (parts.length === 2) {
    // Municipal jurisdiction with explicit province
    const [province, municipality] = parts;
    const municipalityData =
      staticData.structure.municipal[province]?.[municipality];
    if (municipalityData?.departmentsByYear?.[targetYear]) {
      return municipalityData.departmentsByYear[targetYear];
    }
  }

  // Fallback to filesystem if not in static data (shouldn't happen in production)
  const jurisdictionPath = findJurisdictionDataPathWithYear(
    jurisdiction,
    targetYear,
  );
  if (!jurisdictionPath) {
    return [];
  }

  const departmentsDir = path.join(jurisdictionPath, "departments");
  if (!fs.existsSync(departmentsDir)) {
    return [];
  }

  try {
    return fs
      .readdirSync(departmentsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

/**
 * Get expanded department data for all departments in a jurisdiction.
 * Returns full department objects with all their data.
 *
 * @param jurisdiction - Slug in format "province" or "province/municipality"
 * @param year - Optional year string (e.g., "2024") or null for latest
 * @returns Array of full Department objects
 */
export function getExpandedDepartments(
  jurisdiction: string,
  year: string | null = null,
): Department[] {
  const slugs = getDepartmentsForJurisdiction(jurisdiction, year);
  return slugs.map((slug) => getDepartmentData(jurisdiction, slug, year));
}

/**
 * Get the last modified date for a file path from static data.
 * The file path should be relative to the project root.
 *
 * @param relativePath - File path relative to project root (e.g., "data/provincial/ontario/2024/summary.json")
 * @returns Date object if found in static data, undefined otherwise
 */
export function getFileLastModified(relativePath: string): Date | undefined {
  const staticData = loadStaticData();
  const isoString = staticData.fileStats[relativePath];
  return isoString ? new Date(isoString) : undefined;
}
