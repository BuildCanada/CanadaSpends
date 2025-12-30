import { SankeyData } from "@/components/Sankey/SankeyChartD3";
import fs from "fs";
import path from "path";
import { provinceNames } from "./provinceNames";

const dataDir = path.join(process.cwd(), "data");

/**
 * Find the latest year folder in a jurisdiction directory that contains summary.json.
 * Returns the year string (e.g., "2024") or null if no valid year folders found.
 */
function findLatestYear(
  jurisdictionPath: string,
  language?: string,
): string | null {
  if (!fs.existsSync(jurisdictionPath)) {
    return null;
  }

  const entries = fs.readdirSync(jurisdictionPath);
  const yearFolders = entries
    .filter((entry) => {
      const fullPath = path.join(jurisdictionPath, entry);
      return (
        fs.statSync(fullPath).isDirectory() &&
        /^\d{4}$/.test(entry) && // Matches 4-digit year folders
        (fs.existsSync(path.join(fullPath, "summary.json")) || // Must have summary.json in root dir
          (language &&
            fs.existsSync(path.join(fullPath, language, "summary.json")))) // or sub language directory if language is defined
      );
    })
    .map((year) => parseInt(year, 10))
    .sort((a, b) => b - a); // Sort descending (latest first)

  if (yearFolders.length === 0) {
    return null;
  }

  return yearFolders[0].toString();
}

function findLocalizedJurisdictionData(
  jurisdictionPath: string,
  language: string,
): string | null {
  if (!fs.existsSync(jurisdictionPath)) {
    return null;
  }

  const fullPath = path.join(jurisdictionPath, language);

  if (
    fs.existsSync(fullPath) &&
    fs.statSync(fullPath).isDirectory() &&
    fs.existsSync(path.join(fullPath, "summary.json")) // Must have summary.json
  ) {
    return fullPath;
  }

  // Fallback: return the jurisdiction path directly (for backward compatibility)
  return jurisdictionPath;
}

/**
 * Get the path to the data files for a jurisdiction (in the latest year folder).
 * Falls back to the jurisdiction path directly if no year folders exist (backward compatibility).
 */
function getJurisdictionDataPath(
  jurisdictionPath: string,
  language?: string,
): string {
  const latestYear = findLatestYear(jurisdictionPath, language);
  let updatedPath = jurisdictionPath;
  if (latestYear) {
    updatedPath = path.join(updatedPath, latestYear);
  }

  if (language) {
    updatedPath =
      findLocalizedJurisdictionData(updatedPath, language) ?? updatedPath;
  }
  // Fallback: return the jurisdiction path directly (for backward compatibility)
  return updatedPath;
}

/**
 * Find the data path for a jurisdiction slug.
 * Handles both provincial and municipal jurisdictions, with optional explicit province.
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param language - the language in which Jurisdiction data should be present in - default to undefined for backward compatibility
 * @returns The data path to the jurisdiction's data folder, or null if not found
 */
function findJurisdictionDataPath(
  jurisdiction: string,
  language?: string,
): string | null {
  const parts = jurisdiction.split("/");

  if (parts.length === 1) {
    // Could be a province or a municipality - check both
    const provincialPath = path.join(dataDir, "provincial", jurisdiction);
    const provincialDataPath = getJurisdictionDataPath(
      provincialPath,
      language,
    );
    const provincialSummaryPath = path.join(provincialDataPath, "summary.json");

    if (fs.existsSync(provincialSummaryPath)) {
      return provincialDataPath;
    }

    // It's likely a municipality - search for it
    const municipalDir = path.join(dataDir, "municipal");
    if (!fs.existsSync(municipalDir)) {
      return null;
    }

    const provinces = fs.readdirSync(municipalDir).filter((f) => {
      const provincePath = path.join(municipalDir, f);
      return fs.statSync(provincePath).isDirectory();
    });

    for (const province of provinces) {
      const municipalityPath = path.join(municipalDir, province, jurisdiction);
      const municipalityDataPath = getJurisdictionDataPath(
        municipalityPath,
        language,
      );
      const summaryPath = path.join(municipalityDataPath, "summary.json");
      if (fs.existsSync(summaryPath)) {
        return municipalityDataPath;
      }
    }

    return null;
  } else if (parts.length === 2) {
    // Municipal jurisdiction with explicit province
    const [province, municipality] = parts;
    const municipalityPath = path.join(
      dataDir,
      "municipal",
      province,
      municipality,
    );
    const municipalityDataPath = getJurisdictionDataPath(
      municipalityPath,
      language,
    );
    const summaryPath = path.join(municipalityDataPath, "summary.json");
    if (fs.existsSync(summaryPath)) {
      return municipalityDataPath;
    }
    return null;
  }

  return null;
}

export type Jurisdiction = {
  slug: string;
  name: string;
  financialYear: string;
  totalEmployees: number;
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
 * Get provincial jurisdiction slugs (provinces with provincial-level data).
 */
export function getProvincialSlugs(): string[] {
  const provincialDir = path.join(dataDir, "provincial");
  if (!fs.existsSync(provincialDir)) {
    return [];
  }
  return fs.readdirSync(provincialDir).filter((f) => {
    const fullPath = path.join(provincialDir, f);
    if (!fs.statSync(fullPath).isDirectory()) {
      return false;
    }
    const dataPath = getJurisdictionDataPath(fullPath);
    return fs.existsSync(path.join(dataPath, "summary.json"));
  });
}

/**
 * Get municipalities grouped by province.
 * Returns array of { province: string, municipalities: Array<{ slug: string, name: string }> }
 */
export function getMunicipalitiesByProvince(): Array<{
  province: string;
  municipalities: Array<{ slug: string; name: string }>;
}> {
  const municipalDir = path.join(dataDir, "municipal");
  if (!fs.existsSync(municipalDir)) {
    return [];
  }

  const provinces = fs.readdirSync(municipalDir).filter((f) => {
    const provincePath = path.join(municipalDir, f);
    return fs.statSync(provincePath).isDirectory();
  });

  const result: Array<{
    province: string;
    municipalities: Array<{ slug: string; name: string }>;
  }> = [];

  for (const province of provinces) {
    const provincePath = path.join(municipalDir, province);
    const municipalities = fs
      .readdirSync(provincePath)
      .filter((f) => {
        const municipalityPath = path.join(provincePath, f);
        if (!fs.statSync(municipalityPath).isDirectory()) {
          return false;
        }
        const dataPath = getJurisdictionDataPath(municipalityPath);
        return fs.existsSync(path.join(dataPath, "summary.json"));
      })
      .map((slug) => {
        // Try to get the name from summary.json, fallback to slug
        const municipalityPath = path.join(provincePath, slug);
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
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort municipalities alphabetically

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
 * Get all jurisdiction slugs, including both provincial and municipal jurisdictions.
 * Returns slugs in format "province" for provincial or just "municipality" for municipal
 * (municipalities use simple slugs, not nested paths, to match URL structure)
 */
export function getJurisdictionSlugs(): string[] {
  const slugs: string[] = [];

  // Get provincial jurisdictions
  slugs.push(...getProvincialSlugs());

  // Get municipal jurisdictions (return just municipality name, not nested path)
  const municipalDir = path.join(dataDir, "municipal");
  if (fs.existsSync(municipalDir)) {
    const provinces = fs.readdirSync(municipalDir).filter((f) => {
      const provincePath = path.join(municipalDir, f);
      return fs.statSync(provincePath).isDirectory();
    });

    for (const province of provinces) {
      const provincePath = path.join(municipalDir, province);
      const municipalities = fs.readdirSync(provincePath).filter((f) => {
        const municipalityPath = path.join(provincePath, f);
        if (!fs.statSync(municipalityPath).isDirectory()) {
          return false;
        }
        const dataPath = getJurisdictionDataPath(municipalityPath);
        return fs.existsSync(path.join(dataPath, "summary.json"));
      });

      // Return just the municipality slug, not the nested path
      for (const municipality of municipalities) {
        slugs.push(municipality);
      }
    }
  }

  return slugs;
}

/**
 * Get jurisdiction data, supporting both provincial and municipal paths.
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @param language - the language in which Jurisdiction data should be present in - default to undefined for backward compatibility
 *
 * @throws Error if jurisdiction data is not found
 */
export function getJurisdictionData(
  jurisdiction: string,
  language?: string,
): Data {
  const parts = jurisdiction.split("/");
  const jurisdictionPath = findJurisdictionDataPath(jurisdiction, language);

  if (!jurisdictionPath) {
    throw new Error(`Jurisdiction data not found: ${jurisdiction}`);
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
 * @throws Error if jurisdiction or department data is not found
 */
export function getDepartmentData(
  jurisdiction: string,
  department: string,
): Department {
  const jurisdictionPath = findJurisdictionDataPath(jurisdiction);

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
 * Returns empty array if jurisdiction not found or has no departments (non-throwing).
 * @param jurisdiction - Slug in format "province" (provincial), "province/municipality" (municipal), or just "municipality" (will search)
 * @returns Array of department slugs, or empty array if none found
 */
export function getDepartmentsForJurisdiction(jurisdiction: string): string[] {
  const jurisdictionPath = findJurisdictionDataPath(jurisdiction);

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

export function getExpandedDepartments(jurisdiction: string): Department[] {
  const slugs = getDepartmentsForJurisdiction(jurisdiction);
  return slugs.map((slug) => getDepartmentData(jurisdiction, slug));
}

export function departmentHref(
  jurisdiction: string,
  department: string,
  locale?: string,
): string {
  const path = `/${jurisdiction}/departments/${department}`;
  return locale ? `/${locale}${path}` : path;
}
