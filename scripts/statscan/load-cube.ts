#!/usr/bin/env tsx
/**
 * Generic StatsCan cube loader. Works with any standard-format StatsCan CSV.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... tsx scripts/statscan/load-cube.ts <product_id> [options]
 *
 * Options:
 *   --csv <path>       Path to an already-downloaded CSV
 *   --download         Download the CSV from StatsCan first (default if no --csv)
 *   --batch-size <n>   Rows per INSERT batch (default: 5000)
 *   --truncate         Delete existing data for this cube before loading
 *
 * Examples:
 *   tsx scripts/statscan/load-cube.ts 17100005        # Population estimates
 *   tsx scripts/statscan/load-cube.ts 14100287        # Labour force
 *   tsx scripts/statscan/load-cube.ts 18100004        # CPI
 */

import fs from "fs";
import path from "path";
import { getCubeMetadata, getFullTableDownloadURL } from "./utils/wds-client";
import { parseStandardCsv, detectCsvFormat } from "./utils/csv-parser";
import {
  getPool,
  closePool,
  query,
  execute,
  batchInsert,
  runSqlFile,
} from "./utils/db";

const BATCH_SIZE_DEFAULT = 5000;
const SQL_DIR = path.join(__dirname, "sql");

// ── CLI Args ────────────────────────────────────────────────────────────────

interface CliOptions {
  productId: number;
  csvPath?: string;
  download: boolean;
  batchSize: number;
  truncate: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith("-")) {
    console.error(
      "Usage: tsx scripts/statscan/load-cube.ts <product_id> [options]",
    );
    console.error("  e.g., tsx scripts/statscan/load-cube.ts 17100005");
    process.exit(1);
  }

  const productId = parseInt(args[0]);
  if (isNaN(productId)) {
    console.error(`Invalid product_id: ${args[0]}`);
    process.exit(1);
  }

  const opts: CliOptions = {
    productId,
    download: false,
    batchSize: BATCH_SIZE_DEFAULT,
    truncate: false,
  };

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case "--csv":
        opts.csvPath = args[++i];
        break;
      case "--download":
        opts.download = true;
        break;
      case "--batch-size":
        opts.batchSize = parseInt(args[++i]) || BATCH_SIZE_DEFAULT;
        break;
      case "--truncate":
        opts.truncate = true;
        break;
    }
  }

  if (!opts.csvPath) {
    opts.download = true;
  }

  return opts;
}

// ── Ensure Partition Exists ─────────────────────────────────────────────────

async function ensurePartition(productId: number) {
  const partitionName = `data_points_${productId}`;

  // Check if partition exists
  const exists = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'statscan'
         AND c.relname = $1
     ) AS exists`,
    [partitionName],
  );

  if (exists[0].exists) {
    console.log(`  Partition statscan.${partitionName} already exists`);
    return;
  }

  console.log(`  Creating partition statscan.${partitionName}...`);

  await execute(
    `CREATE TABLE statscan.${partitionName}
     PARTITION OF statscan.data_points
     FOR VALUES IN (${productId})`,
  );

  // Create indexes for this partition
  await execute(
    `CREATE INDEX idx_dp_${productId}_coordinate
     ON statscan.${partitionName} USING gist (coordinate)`,
  );
  await execute(
    `CREATE INDEX idx_dp_${productId}_dguid
     ON statscan.${partitionName} (dguid)`,
  );
  await execute(
    `CREATE INDEX idx_dp_${productId}_ref_date
     ON statscan.${partitionName} (ref_date)`,
  );
  await execute(
    `CREATE INDEX idx_dp_${productId}_vector
     ON statscan.${partitionName} (vector)
     WHERE vector IS NOT NULL`,
  );

  // Enable RLS on the partition
  await execute(
    `ALTER TABLE statscan.${partitionName} ENABLE ROW LEVEL SECURITY`,
  );
  await execute(
    `CREATE POLICY "Public read access" ON statscan.${partitionName}
     FOR SELECT TO anon, authenticated USING (true)`,
  );
}

// ── Download CSV ────────────────────────────────────────────────────────────

async function downloadCsv(productId: number): Promise<string> {
  console.log("Getting download URL from StatsCan WDS API...");
  const url = await getFullTableDownloadURL(productId);
  console.log(`Download URL: ${url}`);

  const tmpDir = path.join(process.cwd(), "tmp", "statscan");
  fs.mkdirSync(tmpDir, { recursive: true });

  const zipPath = path.join(tmpDir, `${productId}-eng.zip`);
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

  // Find the data CSV
  const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".csv"));
  const dataFile =
    files.find(
      (f) => f.includes(String(productId)) && !f.includes("MetaData"),
    ) ||
    files.sort((a, b) => {
      const sa = fs.statSync(path.join(tmpDir, a)).size;
      const sb = fs.statSync(path.join(tmpDir, b)).size;
      return sb - sa;
    })[0];

  if (!dataFile) {
    throw new Error("No data CSV found in zip");
  }

  return path.join(tmpDir, dataFile);
}

// ── Load Metadata ───────────────────────────────────────────────────────────

async function loadMetadata(productId: number) {
  console.log("Fetching cube metadata from WDS API...");
  const meta = await getCubeMetadata(productId);

  // Determine frequency
  const freqMap: Record<number, string> = {
    1: "annual",
    2: "biannual",
    4: "quarterly",
    6: "monthly",
    12: "monthly",
    13: "weekly",
    14: "daily",
  };

  await execute(
    `INSERT INTO statscan.cubes (product_id, cansim_id, title_en, title_fr, subject_code, frequency, num_dimensions, source_url, loaded_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
     ON CONFLICT (product_id) DO UPDATE SET
       title_en = EXCLUDED.title_en,
       title_fr = EXCLUDED.title_fr,
       frequency = EXCLUDED.frequency,
       loaded_at = now()`,
    [
      productId,
      meta.cansimId || null,
      meta.cubeTitleEn,
      meta.cubeTitleFr,
      meta.subjectCode?.[0] || null,
      freqMap[meta.dimension.length] || "annual", // rough guess
      meta.dimension.length,
      `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${String(productId).padStart(10, "0")}`,
    ],
  );

  console.log(`  Cube: ${meta.cubeTitleEn}`);
  console.log(`  Dimensions: ${meta.dimension.length}`);

  for (const dim of meta.dimension) {
    const dimRows = await query<{ id: number }>(
      `INSERT INTO statscan.dimensions (product_id, dimension_position, name_en, name_fr)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, dimension_position) DO UPDATE SET
         name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr
       RETURNING id`,
      [
        productId,
        dim.dimensionPositionId,
        dim.dimensionNameEn,
        dim.dimensionNameFr,
      ],
    );
    const dimensionId = dimRows[0].id;

    console.log(
      `  Dimension ${dim.dimensionPositionId}: ${dim.dimensionNameEn} (${dim.member.length} members)`,
    );

    const CHUNK = 500;
    for (let i = 0; i < dim.member.length; i += CHUNK) {
      const chunk = dim.member.slice(i, i + CHUNK);
      const pool = await getPool();
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const m = chunk[j];
        const offset = j * 6;
        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`,
        );
        values.push(
          dimensionId,
          m.memberId,
          m.memberNameEn,
          m.memberNameFr,
          m.parentMemberId,
          m.classificationCode,
        );
      }

      await pool.query(
        `INSERT INTO statscan.members (dimension_id, member_id, name_en, name_fr, parent_member_id, classification_code)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (dimension_id, member_id) DO UPDATE SET
           name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr`,
        values,
      );
    }
  }

  console.log("Metadata loaded.\n");
  return meta;
}

// ── Load Data Points ────────────────────────────────────────────────────────

async function loadDataPoints(
  productId: number,
  csvPath: string,
  batchSize: number,
  truncateFirst: boolean,
) {
  console.log("Loading data points...");

  const format = await detectCsvFormat(csvPath);
  if (format !== "standard") {
    console.error(
      "ERROR: This CSV uses a transposed format. Use load-census-profile.ts for transposed CSVs.",
    );
    process.exit(1);
  }

  if (truncateFirst) {
    console.log(`  Clearing existing data for product ${productId}...`);
    await execute("DELETE FROM statscan.data_points WHERE product_id = $1", [
      productId,
    ]);
  }

  // Create sync log
  const logRows = await query<{ id: number }>(
    `INSERT INTO statscan.sync_log (product_id, sync_type, started_at, status)
     VALUES ($1, 'full', now(), 'in_progress') RETURNING id`,
    [productId],
  );
  const syncLogId = logRows[0].id;

  let totalRows = 0;
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

    if (totalRows % 50000 < batchSize) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (totalRows / ((Date.now() - startTime) / 1000)).toFixed(0);
      console.log(
        `  ${totalRows.toLocaleString()} rows loaded (${elapsed}s, ${rate} rows/s)`,
      );
    }
  };

  // Also collect geographies
  const seenGeos = new Map<string, string>();

  for await (const dp of parseStandardCsv(csvPath)) {
    // Track geographies
    if (dp.dguid && !seenGeos.has(dp.dguid)) {
      seenGeos.set(dp.dguid, dp.geoName);
    }

    const coordParts = dp.coordinate.split(".").map(Number);
    const cubeExpr = `(${coordParts.join(",")})`;

    batch.push([
      productId,
      dp.refDate,
      dp.dguid || null,
      cubeExpr,
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

  await flushBatch();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `  Total: ${totalRows.toLocaleString()} rows loaded in ${elapsed}s`,
  );

  // Load geographies encountered in this CSV
  if (seenGeos.size > 0) {
    console.log(`  Loading ${seenGeos.size} geographies...`);
    const CHUNK = 500;
    const geoEntries = [...seenGeos.entries()];

    for (let i = 0; i < geoEntries.length; i += CHUNK) {
      const chunk = geoEntries.slice(i, i + CHUNK);
      const pool = await getPool();
      const values: unknown[] = [];
      const placeholders: string[] = [];

      for (let j = 0; j < chunk.length; j++) {
        const [dguid, name] = chunk[j];
        const offset = j * 3;
        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
        values.push(dguid, name, "Unknown");
      }

      await pool.query(
        `INSERT INTO statscan.geographies (dguid, name_en, geo_level)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (dguid) DO NOTHING`,
        values,
      );
    }
  }

  // Update sync log and cube
  await execute(
    `UPDATE statscan.sync_log SET completed_at = now(), rows_loaded = $1, status = 'success'
     WHERE id = $2`,
    [totalRows, syncLogId],
  );
  await execute(
    `UPDATE statscan.cubes SET row_count = $1, loaded_at = now() WHERE product_id = $2`,
    [totalRows, productId],
  );

  return totalRows;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs();

  console.log("=== StatsCan Cube Loader ===\n");
  console.log(`Product ID: ${opts.productId}`);
  console.log(`Batch size: ${opts.batchSize}`);
  console.log();

  try {
    // Ensure base schema exists
    const schemaPath = path.join(SQL_DIR, "001_create_schema.sql");
    if (fs.existsSync(schemaPath)) {
      try {
        await runSqlFile(schemaPath);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("already exists")) throw err;
      }
    }

    // Ensure partition exists
    await ensurePartition(opts.productId);

    // Get CSV
    let csvPath = opts.csvPath;
    if (!csvPath || opts.download) {
      csvPath = await downloadCsv(opts.productId);
    }

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log(
      `CSV file: ${csvPath} (${(fs.statSync(csvPath).size / 1024 / 1024).toFixed(1)} MB)\n`,
    );

    // Load metadata
    await loadMetadata(opts.productId);

    // Load data
    await loadDataPoints(
      opts.productId,
      csvPath,
      opts.batchSize,
      opts.truncate,
    );

    // Analyze
    console.log("Running ANALYZE...");
    const partitionName = `data_points_${opts.productId}`;
    await execute(`ANALYZE statscan.${partitionName}`);

    console.log("\n=== Load complete ===");
  } catch (err) {
    console.error("\nFATAL ERROR:", err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

main();
