#!/usr/bin/env tsx
/**
 * Load the Census Profile (product_id 98100001) into PostgreSQL.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/statscan/load-census-profile.ts [options]
 *
 * Options:
 *   --csv <path>       Path to an already-downloaded Census Profile CSV
 *   --download         Download the CSV from StatsCan first (default if no --csv)
 *   --skip-schema      Skip running SQL migrations (assume schema exists)
 *   --batch-size <n>   Rows per INSERT batch (default: 5000)
 *   --geo-levels <list> Comma-separated geo levels to load (default: all)
 *                       e.g., "Country,Province/territory,Census metropolitan area"
 */

import fs from "fs";
import path from "path";
import { getCubeMetadata, getFullTableDownloadURL } from "./utils/wds-client";
import {
  parseStandardCsv,
  parseTransposedCsv,
  detectCsvFormat,
} from "./utils/csv-parser";
import {
  getPool,
  closePool,
  query,
  execute,
  batchInsert,
  runSqlFile,
} from "./utils/db";

const PRODUCT_ID = 98100001;
const BATCH_SIZE_DEFAULT = 5000;
const SQL_DIR = path.join(__dirname, "sql");

// ── CLI Args ────────────────────────────────────────────────────────────────

interface CliOptions {
  csvPath?: string;
  download: boolean;
  skipSchema: boolean;
  batchSize: number;
  geoLevels?: string[];
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    download: false,
    skipSchema: false,
    batchSize: BATCH_SIZE_DEFAULT,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--csv":
        opts.csvPath = args[++i];
        break;
      case "--download":
        opts.download = true;
        break;
      case "--skip-schema":
        opts.skipSchema = true;
        break;
      case "--batch-size":
        opts.batchSize = parseInt(args[++i]) || BATCH_SIZE_DEFAULT;
        break;
      case "--geo-levels":
        opts.geoLevels = args[++i].split(",").map((s) => s.trim());
        break;
    }
  }

  if (!opts.csvPath) {
    opts.download = true;
  }

  return opts;
}

// ── Schema Setup ────────────────────────────────────────────────────────────

async function runMigrations() {
  console.log("Running SQL migrations...");

  const sqlFiles = [
    "001_create_schema.sql",
    "002_census_partition.sql",
    "003_rpc_functions.sql",
    "004_grants.sql",
  ];

  for (const file of sqlFiles) {
    const filePath = path.join(SQL_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`  Running ${file}...`);
      try {
        await runSqlFile(filePath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Ignore "already exists" errors for idempotency
        if (msg.includes("already exists") || msg.includes("duplicate key")) {
          console.log(`  (skipped: already exists)`);
        } else {
          throw err;
        }
      }
    }
  }

  console.log("Migrations complete.\n");
}

// ── Download CSV ────────────────────────────────────────────────────────────

async function downloadCsv(): Promise<string> {
  console.log("Getting download URL from StatsCan WDS API...");
  const url = await getFullTableDownloadURL(PRODUCT_ID);
  console.log(`Download URL: ${url}`);

  const tmpDir = path.join(process.cwd(), "tmp", "statscan");
  fs.mkdirSync(tmpDir, { recursive: true });

  const zipPath = path.join(tmpDir, `${PRODUCT_ID}-eng.zip`);
  console.log(`Downloading to ${zipPath}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(zipPath, buffer);
  console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Extract zip
  console.log("Extracting...");
  const { execSync } = await import("child_process");
  execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: "pipe" });

  // Find the data CSV (largest CSV file, or one matching the product ID)
  const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".csv"));
  const dataFile =
    files.find(
      (f) => f.includes(String(PRODUCT_ID)) && !f.includes("MetaData"),
    ) ||
    files.sort((a, b) => {
      const sa = fs.statSync(path.join(tmpDir, a)).size;
      const sb = fs.statSync(path.join(tmpDir, b)).size;
      return sb - sa;
    })[0];

  if (!dataFile) {
    throw new Error("No data CSV found in zip");
  }

  const csvPath = path.join(tmpDir, dataFile);
  console.log(`Data file: ${csvPath}\n`);
  return csvPath;
}

// ── Load Metadata ───────────────────────────────────────────────────────────

async function loadMetadata() {
  console.log("Fetching cube metadata from WDS API...");
  const meta = await getCubeMetadata(PRODUCT_ID);

  // Insert cube record
  await execute(
    `INSERT INTO statscan.cubes (product_id, cansim_id, title_en, title_fr, subject_code, num_dimensions, source_url, loaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (product_id) DO UPDATE SET
       title_en = EXCLUDED.title_en,
       title_fr = EXCLUDED.title_fr,
       loaded_at = now()`,
    [
      PRODUCT_ID,
      meta.cansimId || null,
      meta.cubeTitleEn,
      meta.cubeTitleFr,
      meta.subjectCode?.[0] || null,
      meta.dimension.length,
      `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${String(PRODUCT_ID).padStart(10, "0")}`,
    ],
  );

  console.log(`  Cube: ${meta.cubeTitleEn}`);
  console.log(`  Dimensions: ${meta.dimension.length}`);

  // Insert dimensions and members
  for (const dim of meta.dimension) {
    // Upsert dimension
    const dimRows = await query<{ id: number }>(
      `INSERT INTO statscan.dimensions (product_id, dimension_position, name_en, name_fr)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, dimension_position) DO UPDATE SET
         name_en = EXCLUDED.name_en,
         name_fr = EXCLUDED.name_fr
       RETURNING id`,
      [
        PRODUCT_ID,
        dim.dimensionPositionId,
        dim.dimensionNameEn,
        dim.dimensionNameFr,
      ],
    );
    const dimensionId = dimRows[0].id;

    console.log(
      `  Dimension ${dim.dimensionPositionId}: ${dim.dimensionNameEn} (${dim.member.length} members)`,
    );

    // Batch insert members
    const memberRows = dim.member.map((m) => [
      dimensionId,
      m.memberId,
      m.memberNameEn,
      m.memberNameFr,
      m.parentMemberId,
      m.classificationCode,
    ]);

    // Insert in chunks to stay under PostgreSQL parameter limits
    const MEMBER_CHUNK = 500;
    for (let i = 0; i < memberRows.length; i += MEMBER_CHUNK) {
      const chunk = memberRows.slice(i, i + MEMBER_CHUNK);

      // Use raw SQL for upsert since batchInsert uses ON CONFLICT DO NOTHING
      const pool = await getPool();
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const row = chunk[j];
        const offset = j * 6;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`,
        );
        values.push(...row);
      }

      await pool.query(
        `INSERT INTO statscan.members (dimension_id, member_id, name_en, name_fr, parent_member_id, classification_code)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (dimension_id, member_id) DO UPDATE SET
           name_en = EXCLUDED.name_en,
           name_fr = EXCLUDED.name_fr,
           parent_member_id = EXCLUDED.parent_member_id,
           classification_code = EXCLUDED.classification_code`,
        values,
      );
    }
  }

  // Load common UOM values
  const uomValues: [number, string][] = [
    [0, "Units"],
    [1, "Number"],
    [2, "Percent"],
    [3, "Dollars"],
    [4, "Persons"],
    [5, "Rate"],
    [17, "Index"],
    [26, "Years"],
    [28, "Tonnes"],
    [81, "Ratio"],
    [223, "Persons per square kilometre"],
    [249, "Percentage point"],
  ];

  for (const [id, name] of uomValues) {
    await execute(
      `INSERT INTO statscan.units_of_measure (uom_id, name_en)
       VALUES ($1, $2)
       ON CONFLICT (uom_id) DO UPDATE SET name_en = EXCLUDED.name_en`,
      [id, name],
    );
  }

  // Load common scalar factors
  const scalarValues: [number, string, number][] = [
    [0, "Units", 1],
    [1, "Tens", 10],
    [2, "Hundreds", 100],
    [3, "Thousands", 1000],
    [4, "Tens of thousands", 10000],
    [5, "Hundreds of thousands", 100000],
    [6, "Millions", 1000000],
    [9, "Billions", 1000000000],
  ];

  for (const [id, name, mult] of scalarValues) {
    await execute(
      `INSERT INTO statscan.scalar_factors (scalar_id, name_en, multiplier)
       VALUES ($1, $2, $3)
       ON CONFLICT (scalar_id) DO UPDATE SET name_en = EXCLUDED.name_en, multiplier = EXCLUDED.multiplier`,
      [id, name, mult],
    );
  }

  console.log("Metadata loaded.\n");
  return meta;
}

// ── Load Geographies from CSV ───────────────────────────────────────────────

async function loadGeographies(
  csvPath: string,
  geoLevels?: string[],
): Promise<Set<string>> {
  console.log("Loading geographies from CSV...");

  const seen = new Map<
    string,
    { name: string; level: string; altGeo: string; province: string }
  >();
  let lineCount = 0;

  for await (const dp of parseStandardCsv(csvPath)) {
    lineCount++;
    if (!dp.dguid || seen.has(dp.dguid)) continue;
    if (geoLevels && !geoLevels.some((gl) => dp.geoName.includes(gl))) {
      // We'll filter by actual geo_level, not geoName — so collect all first
    }

    seen.set(dp.dguid, {
      name: dp.geoName,
      level: guessGeoLevel(dp.dguid),
      altGeo: dp.dguid.replace(/^\d{4}[A-Z]\d{4}/, ""),
      province: extractProvinceCode(dp.dguid),
    });
  }

  // Filter by geo level if specified
  const filteredDguids = new Set<string>();
  const geoRows: unknown[][] = [];

  for (const [dguid, geo] of seen) {
    if (geoLevels && !geoLevels.includes(geo.level)) continue;
    filteredDguids.add(dguid);
    geoRows.push([
      dguid,
      geo.name,
      null,
      geo.level,
      geo.altGeo,
      geo.province,
      null,
    ]);
  }

  // Batch insert
  const CHUNK = 500;
  for (let i = 0; i < geoRows.length; i += CHUNK) {
    const chunk = geoRows.slice(i, i + CHUNK);
    const pool = await getPool();
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const offset = j * 7;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      values.push(...row);
    }

    await pool.query(
      `INSERT INTO statscan.geographies (dguid, name_en, name_fr, geo_level, alt_geo_code, province_code, parent_dguid)
       VALUES ${placeholders.join(",")}
       ON CONFLICT (dguid) DO UPDATE SET
         name_en = EXCLUDED.name_en,
         geo_level = EXCLUDED.geo_level,
         province_code = EXCLUDED.province_code`,
      values,
    );
  }

  console.log(
    `  Loaded ${geoRows.length} geographies (from ${lineCount} CSV lines)`,
  );
  console.log(`  Levels: ${[...new Set(geoRows.map((r) => r[3]))].join(", ")}`);
  console.log();

  return filteredDguids;
}

/**
 * Guess geographic level from DGUID format.
 * DGUID format: YYYYSLLLLnnnnnnn
 *   YYYY = reference year
 *   S = geographic level code (A=country, S=province, etc.)
 *   LLLL = level-specific code
 */
function guessGeoLevel(dguid: string): string {
  if (!dguid || dguid.length < 6) return "Unknown";

  // Census 2021+ DGUIDs
  const levelChar = dguid.charAt(4);
  const levelCode = dguid.substring(5, 9);

  if (levelChar === "A" && levelCode === "0000") return "Country";
  if (levelChar === "A" && levelCode === "0003") return "Province/territory";
  if (levelChar === "S") return "Province/territory";
  if (levelChar === "A" && levelCode === "0005") return "Census division";
  if (levelChar === "A" && levelCode === "0011") return "Census subdivision";
  if (levelChar === "A" && levelCode === "0013") return "Census tract";
  if (levelChar === "A" && levelCode === "0015") return "Dissemination area";
  if (levelChar === "A" && levelCode === "0002")
    return "Census metropolitan area";

  // Fallback: check the numeric code range
  const numericPart = dguid.substring(9);
  if (numericPart.length <= 2) return "Province/territory";
  if (numericPart.length <= 4) return "Census division";
  if (numericPart.length <= 7) return "Census subdivision";

  return "Unknown";
}

function extractProvinceCode(dguid: string): string {
  if (!dguid || dguid.length < 12) return "";
  // Province code is typically positions 9-10 in the DGUID
  return dguid.substring(9, 11);
}

// ── Load Data Points ────────────────────────────────────────────────────────

async function loadDataPoints(
  csvPath: string,
  batchSize: number,
  allowedDguids?: Set<string>,
) {
  console.log("Loading data points...");

  // Detect format
  const format = await detectCsvFormat(csvPath);
  console.log(`  CSV format: ${format}`);

  // Clear existing data for this product
  console.log("  Clearing existing data for product 98100001...");
  await execute("DELETE FROM statscan.data_points WHERE product_id = $1", [
    PRODUCT_ID,
  ]);

  // Create sync log entry
  const logRows = await query<{ id: number }>(
    `INSERT INTO statscan.sync_log (product_id, sync_type, started_at, status)
     VALUES ($1, 'full', now(), 'in_progress') RETURNING id`,
    [PRODUCT_ID],
  );
  const syncLogId = logRows[0].id;

  let totalRows = 0;
  let skippedRows = 0;
  let batch: unknown[][] = [];
  const startTime = Date.now();

  const columns = [
    "product_id",
    "ref_date",
    "dguid",
    "coordinate",
    "coordinate_text",
    "vector",
    "value",
    "uom_id",
    "scalar_id",
    "status",
    "symbol",
    "decimals",
  ];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await batchInsert("statscan.data_points", columns, batch);
    totalRows += batch.length;
    batch = [];

    // Progress report every 50k rows
    if (totalRows % 50000 < batchSize) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalRows / ((Date.now() - startTime) / 1000)).toFixed(0);
      console.log(
        `  ${totalRows.toLocaleString()} rows loaded (${elapsed}s, ${rate} rows/s)`,
      );
    }
  };

  // Iterate through the CSV
  const parser =
    format === "standard"
      ? parseStandardCsv(csvPath)
      : createTransposedParser(csvPath);

  for await (const dp of parser) {
    // Skip if filtering by geography and this DGUID isn't in the set
    if (allowedDguids && dp.dguid && !allowedDguids.has(dp.dguid)) {
      skippedRows++;
      continue;
    }

    // Convert coordinate string to cube expression
    const coordParts = dp.coordinate.split(".").map(Number);
    const cubeExpr = `(${coordParts.join(",")})`;

    batch.push([
      PRODUCT_ID,
      dp.refDate,
      dp.dguid || null,
      cubeExpr, // Will be cast to cube type
      dp.coordinate,
      dp.vector || null,
      dp.value,
      dp.uomId || null,
      dp.scalarId || null,
      dp.status || null,
      dp.symbol || null,
      dp.decimals || null,
    ]);

    if (batch.length >= batchSize) {
      await flushBatch();
    }
  }

  // Flush remaining
  await flushBatch();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n  Total: ${totalRows.toLocaleString()} rows loaded in ${elapsed}s`,
  );
  if (skippedRows > 0) {
    console.log(
      `  Skipped: ${skippedRows.toLocaleString()} rows (geo level filter)`,
    );
  }

  // Update sync log
  await execute(
    `UPDATE statscan.sync_log SET completed_at = now(), rows_loaded = $1, status = 'success'
     WHERE id = $2`,
    [totalRows, syncLogId],
  );

  // Update cube row count
  await execute(
    `UPDATE statscan.cubes SET row_count = $1, loaded_at = now() WHERE product_id = $2`,
    [totalRows, PRODUCT_ID],
  );

  return totalRows;
}

/**
 * Create a transposed parser that reads member columns from the CSV header
 * and cross-references them with the dimension metadata in the database.
 */
async function* createTransposedParser(
  csvPath: string,
): AsyncGenerator<import("./utils/csv-parser").RawDataPoint> {
  // Read the first line to get column headers
  const { createReadStream } = await import("fs");
  const { createInterface } = await import("readline");

  const rl = createInterface({
    input: createReadStream(csvPath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headerLine = "";
  for await (const line of rl) {
    headerLine = line.replace(/^\uFEFF/, "");
    rl.close();
    break;
  }

  // Parse headers and identify member columns
  // In the transposed census CSV, member columns are named like:
  //   "Population, 2021 [1]", "Population, 2016 [2]", etc.
  // where [N] is the member_id
  const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""));
  const memberColumns = new Map<string, number>();

  // Known non-member columns
  const systemCols = new Set([
    "REF_DATE",
    "GEO",
    "DGUID",
    "GEO_LEVEL",
    "ALT_GEO_CODE",
    "COORDINATE",
  ]);

  for (const header of headers) {
    const upper = header.toUpperCase();
    if (systemCols.has(upper) || upper.startsWith("SYMBOL")) continue;

    // Try to extract member ID from bracket notation: "Name [123]"
    const bracketMatch = header.match(/\[(\d+)\]\s*$/);
    if (bracketMatch) {
      memberColumns.set(header, parseInt(bracketMatch[1]));
    }
  }

  if (memberColumns.size === 0) {
    throw new Error(
      "No transposed member columns found. Expected columns like 'Name [1]', 'Name [2]', etc.",
    );
  }

  console.log(`  Found ${memberColumns.size} transposed member columns`);

  // Now parse using the transposed parser
  yield* parseTransposedCsv(csvPath, memberColumns);
}

// ── Validation ──────────────────────────────────────────────────────────────

async function validate() {
  console.log("Validating...");

  const countResult = await query<{ count: string }>(
    "SELECT count(*)::text as count FROM statscan.data_points WHERE product_id = $1",
    [PRODUCT_ID],
  );
  console.log(
    `  Data points: ${parseInt(countResult[0].count).toLocaleString()}`,
  );

  const geoResult = await query<{ count: string }>(
    "SELECT count(*)::text as count FROM statscan.geographies",
  );
  console.log(
    `  Geographies: ${parseInt(geoResult[0].count).toLocaleString()}`,
  );

  const dimResult = await query<{ name_en: string; member_count: string }>(
    `SELECT d.name_en, count(m.id)::text as member_count
     FROM statscan.dimensions d
     JOIN statscan.members m ON m.dimension_id = d.id
     WHERE d.product_id = $1
     GROUP BY d.dimension_position, d.name_en
     ORDER BY d.dimension_position`,
    [PRODUCT_ID],
  );
  for (const dim of dimResult) {
    console.log(`  Dimension "${dim.name_en}": ${dim.member_count} members`);
  }

  // Spot check: try to find Canada's population
  const spotCheck = await query<{ value: number; geo: string }>(
    `SELECT dp.value, g.name_en as geo
     FROM statscan.data_points dp
     LEFT JOIN statscan.geographies g ON g.dguid = dp.dguid
     WHERE dp.product_id = $1
       AND dp.coordinate_text LIKE '1.1%'
     LIMIT 5`,
    [PRODUCT_ID],
  );
  if (spotCheck.length > 0) {
    console.log("  Spot check (coordinate 1.1...):");
    for (const row of spotCheck) {
      console.log(`    ${row.geo}: ${row.value}`);
    }
  }

  // Analyze for query planner
  console.log("  Running ANALYZE...");
  await execute("ANALYZE statscan.data_points_98100001");
  await execute("ANALYZE statscan.geographies");

  console.log("Validation complete.\n");
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  console.log("=== StatsCan Census Profile Loader ===\n");
  console.log(`Product ID: ${PRODUCT_ID}`);
  console.log(`Batch size: ${opts.batchSize}`);
  if (opts.geoLevels) {
    console.log(`Geo levels: ${opts.geoLevels.join(", ")}`);
  }
  console.log();

  try {
    // Step 1: Run schema migrations
    if (!opts.skipSchema) {
      await runMigrations();
    }

    // Step 2: Get CSV file
    let csvPath = opts.csvPath;
    if (!csvPath || opts.download) {
      csvPath = await downloadCsv();
    }

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    const fileSize = fs.statSync(csvPath).size;
    console.log(
      `CSV file: ${csvPath} (${(fileSize / 1024 / 1024).toFixed(1)} MB)\n`,
    );

    // Step 3: Load metadata from WDS API
    await loadMetadata();

    // Step 4: Load geographies from CSV
    let allowedDguids: Set<string> | undefined;
    if (opts.geoLevels) {
      allowedDguids = await loadGeographies(csvPath, opts.geoLevels);
    } else {
      await loadGeographies(csvPath);
    }

    // Step 5: Load data points
    await loadDataPoints(csvPath, opts.batchSize, allowedDguids);

    // Step 6: Validate
    await validate();

    console.log("=== Load complete ===");
  } catch (err) {
    console.error("\nFATAL ERROR:", err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
