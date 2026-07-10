#!/usr/bin/env tsx
/**
 * Generate static build-time data
 * Currently generates sitemap file stats (pre-computed file modification times)
 * Can be extended to generate other static build-time data in the future
 */

import fs from "fs";
import path from "path";
import {
  getProvincialSlugs,
  getMunicipalitiesByProvince,
} from "../src/lib/jurisdictions";
import { getArticleSlugs } from "../src/lib/articles";
import { locales } from "../src/locales";

const projectRoot = process.cwd();
const dataDir = path.join(projectRoot, "data");
const articlesDir = path.join(projectRoot, "articles");
const outputPath = path.join(projectRoot, "data", "static-data.json");

function toRelativePath(absolutePath: string): string {
  return path.relative(projectRoot, absolutePath);
}

interface StaticData {
  fileStats: Record<string, string | null>; // file path -> ISO date string or null
  structure: {
    provincial: Record<
      string,
      {
        years: string[];
        departmentsByYear: Record<string, string[]>; // year -> department slugs
      }
    >;
    municipal: Record<
      string,
      Record<
        string,
        {
          years: string[];
          departmentsByYear: Record<string, string[]>; // year -> department slugs
        }
      >
    >; // province -> municipality -> data
    federal: {
      years: string[];
      departmentsByYear: Record<string, string[]>; // year -> department slugs
    };
    articles: Record<string, string[]>; // lang -> article slugs
  };
}

/**
 * Get all available years for a jurisdiction directory.
 * @param jurisdictionPath - Path to the jurisdiction directory
 * @returns Array of year strings, sorted descending (latest first)
 */
function getAvailableYears(jurisdictionPath: string): string[] {
  if (!fs.existsSync(jurisdictionPath)) {
    return [];
  }

  const entries = fs.readdirSync(jurisdictionPath);
  const yearFolders = entries
    .filter((entry) => {
      const fullPath = path.join(jurisdictionPath, entry);
      return (
        fs.statSync(fullPath).isDirectory() &&
        /^\d{4}$/.test(entry) && // Matches 4-digit year folders
        fs.existsSync(path.join(fullPath, "summary.json")) // Must have summary.json
      );
    })
    .map((year) => parseInt(year, 10))
    .sort((a, b) => b - a); // Sort descending (latest first)

  return yearFolders.map((year) => year.toString());
}

function getFileLastModified(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.mtime.toISOString();
    }
  } catch {
    // File doesn't exist or can't be accessed
  }
  return null;
}

function generateStaticData(): StaticData {
  const fileStats: Record<string, string | null> = {};
  const structure: StaticData["structure"] = {
    provincial: {},
    municipal: {},
    federal: { years: [], departmentsByYear: {} },
    articles: {},
  };

  // Provincial pages
  const provinces = getProvincialSlugs();
  for (const province of provinces) {
    const provincialPath = path.join(dataDir, "provincial", province);
    const years = getAvailableYears(provincialPath);
    const departmentsByYear: Record<string, string[]> = {};

    // Latest year summary.json (for non-year pages)
    const latestYear = years[0];
    if (latestYear) {
      const latestYearPath = path.join(
        provincialPath,
        latestYear,
        "summary.json",
      );
      fileStats[toRelativePath(latestYearPath)] =
        getFileLastModified(latestYearPath);
    }

    // Year-specific summary.json files and departments
    for (const year of years) {
      const yearSummaryPath = path.join(provincialPath, year, "summary.json");
      fileStats[toRelativePath(yearSummaryPath)] =
        getFileLastModified(yearSummaryPath);

      // Department files
      const yearDataPath = path.join(provincialPath, year);
      const departmentsDir = path.join(yearDataPath, "departments");
      const departments: string[] = [];
      if (fs.existsSync(departmentsDir)) {
        const departmentFiles = fs
          .readdirSync(departmentsDir)
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(".json", ""));
        departments.push(...departmentFiles);

        for (const department of departmentFiles) {
          const departmentPath = path.join(
            departmentsDir,
            `${department}.json`,
          );
          fileStats[toRelativePath(departmentPath)] =
            getFileLastModified(departmentPath);
        }
      }
      departmentsByYear[year] = departments;
    }

    structure.provincial[province] = {
      years,
      departmentsByYear,
    };
  }

  // Municipal pages
  const municipalitiesByProvince = getMunicipalitiesByProvince();
  for (const { province, municipalities } of municipalitiesByProvince) {
    if (!structure.municipal[province]) {
      structure.municipal[province] = {};
    }

    for (const municipality of municipalities) {
      const municipalPath = path.join(
        dataDir,
        "municipal",
        province,
        municipality.slug,
      );
      const years = getAvailableYears(municipalPath);
      const departmentsByYear: Record<string, string[]> = {};

      // Latest year summary.json (for non-year pages)
      const latestYear = years[0];
      if (latestYear) {
        const latestYearPath = path.join(
          municipalPath,
          latestYear,
          "summary.json",
        );
        fileStats[toRelativePath(latestYearPath)] =
          getFileLastModified(latestYearPath);
      }

      // Year-specific summary.json files and departments
      for (const year of years) {
        const yearSummaryPath = path.join(municipalPath, year, "summary.json");
        fileStats[toRelativePath(yearSummaryPath)] =
          getFileLastModified(yearSummaryPath);

        // Department files
        const yearDataPath = path.join(municipalPath, year);
        const departmentsDir = path.join(yearDataPath, "departments");
        const departments: string[] = [];
        if (fs.existsSync(departmentsDir)) {
          const departmentFiles = fs
            .readdirSync(departmentsDir)
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(".json", ""));
          departments.push(...departmentFiles);

          for (const department of departmentFiles) {
            const departmentPath = path.join(
              departmentsDir,
              `${department}.json`,
            );
            fileStats[toRelativePath(departmentPath)] =
              getFileLastModified(departmentPath);
          }
        }
        departmentsByYear[year] = departments;
      }

      structure.municipal[province][municipality.slug] = {
        years,
        departmentsByYear,
      };
    }
  }

  // Federal pages (Public Accounts pipeline — data/federal/{year})
  const federalPath = path.join(dataDir, "federal");
  const federalYears = getAvailableYears(federalPath);
  const federalDepartmentsByYear: Record<string, string[]> = {};
  const federalLatestYear = federalYears[0];
  if (federalLatestYear) {
    const latestYearPath = path.join(
      federalPath,
      federalLatestYear,
      "summary.json",
    );
    fileStats[toRelativePath(latestYearPath)] =
      getFileLastModified(latestYearPath);
  }
  for (const year of federalYears) {
    const yearSummaryPath = path.join(federalPath, year, "summary.json");
    fileStats[toRelativePath(yearSummaryPath)] =
      getFileLastModified(yearSummaryPath);

    const departmentsDir = path.join(federalPath, year, "departments");
    const departments: string[] = [];
    if (fs.existsSync(departmentsDir)) {
      const departmentFiles = fs
        .readdirSync(departmentsDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""));
      departments.push(...departmentFiles);

      for (const department of departmentFiles) {
        const departmentPath = path.join(departmentsDir, `${department}.json`);
        fileStats[toRelativePath(departmentPath)] =
          getFileLastModified(departmentPath);
      }
    }
    federalDepartmentsByYear[year] = departments;
  }
  structure.federal = {
    years: federalYears,
    departmentsByYear: federalDepartmentsByYear,
  };

  // Article pages
  for (const lang of locales) {
    const articleSlugs = getArticleSlugs(lang);
    structure.articles[lang] = articleSlugs;
    for (const slug of articleSlugs) {
      const articleMetadataPath = path.join(
        articlesDir,
        lang,
        slug,
        "metadata.json",
      );
      fileStats[toRelativePath(articleMetadataPath)] =
        getFileLastModified(articleMetadataPath);
    }
  }

  return {
    fileStats,
    structure,
  };
}

// Generate static data and write to file
console.log("Generating static build-time data...");
const staticData = generateStaticData();

// Add disclaimer as first property
const outputData = {
  _disclaimer:
    "⚠️ AUTO-GENERATED FILE - DO NOT EDIT MANUALLY ⚠️\n" +
    "This file is automatically generated by scripts/generate-statics.ts during the build process.\n" +
    "Any manual changes will be overwritten. To modify this data, update the source files and rebuild.",
  ...staticData,
};

// Ensure data directory exists
const dataDirPath = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDirPath)) {
  fs.mkdirSync(dataDirPath, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(
  `✓ Generated static data: ${Object.keys(staticData.fileStats).length} file stats, ${Object.keys(staticData.structure.provincial).length} provinces, ${Object.values(staticData.structure.municipal).flatMap((p) => Object.keys(p)).length} municipalities`,
);
console.log(`  Output: ${outputPath}`);
