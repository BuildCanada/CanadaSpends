/**
 * PostgreSQL connection for StatsCan ETL scripts.
 *
 * Uses the DATABASE_URL env var for connection. For Supabase self-hosted,
 * this is typically: postgresql://postgres:PASSWORD@HOST:5432/postgres
 *
 * This module is only used by ETL scripts, NOT the Next.js app.
 * The frontend queries data via the Supabase REST API instead.
 */

// Dynamic import so this doesn't fail at import time if pg isn't installed.
// pg is only needed for ETL scripts, not the Next.js frontend build.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pgModule: any = null;

async function getPg() {
  if (!pgModule) {
    try {
      // @ts-expect-error pg is an optional dependency, only needed for ETL scripts
      pgModule = await import("pg");
    } catch {
      throw new Error(
        'The "pg" package is required for ETL scripts. Install it with: pnpm add -D pg @types/pg',
      );
    }
  }
  return pgModule;
}

export interface DbConfig {
  connectionString?: string;
  maxConnections?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any = null;

export async function getPool(config?: DbConfig) {
  if (pool) return pool;

  const pg = await getPg();
  const connectionString = config?.connectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required.\n" +
        "Set it to your Supabase PostgreSQL connection string, e.g.:\n" +
        "  export DATABASE_URL=postgresql://postgres:PASSWORD@api.buildcanada.com:5432/postgres",
    );
  }

  pool = new pg.Pool({
    connectionString,
    max: config?.maxConnections || 5,
  });

  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Execute a query with automatic connection handling.
 */
export async function query<
  T extends Record<string, unknown> = Record<string, unknown>,
>(sql: string, params?: unknown[]): Promise<T[]> {
  const p = await getPool();
  const result = await p.query(sql, params);
  return result.rows as T[];
}

/**
 * Execute a statement (INSERT, UPDATE, etc.) and return the row count.
 */
export async function execute(
  sql: string,
  params?: unknown[],
): Promise<number> {
  const p = await getPool();
  const result = await p.query(sql, params);
  return result.rowCount ?? 0;
}

/**
 * Batch insert rows using a parameterized multi-row INSERT.
 * Much faster than individual inserts, though slower than COPY.
 */
export async function batchInsert(
  table: string,
  columns: string[],
  rows: unknown[][],
): Promise<number> {
  if (rows.length === 0) return 0;

  const p = await getPool();
  const colList = columns.join(", ");
  const numCols = columns.length;

  // Build parameterized values: ($1,$2,$3), ($4,$5,$6), ...
  const valueClauses: string[] = [];
  const allParams: unknown[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const placeholders: string[] = [];
    for (let j = 0; j < numCols; j++) {
      placeholders.push(`$${i * numCols + j + 1}`);
      allParams.push(row[j]);
    }
    valueClauses.push(`(${placeholders.join(",")})`);
  }

  const sql = `INSERT INTO ${table} (${colList}) VALUES ${valueClauses.join(",")} ON CONFLICT DO NOTHING`;
  const result = await p.query(sql, allParams);
  return result.rowCount ?? 0;
}

/**
 * Run a SQL file against the database.
 */
export async function runSqlFile(filePath: string): Promise<void> {
  const fs = await import("fs");
  const sql = fs.readFileSync(filePath, "utf-8");
  const p = await getPool();
  await p.query(sql);
}
