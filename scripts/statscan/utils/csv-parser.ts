/**
 * CSV parser for StatsCan data files.
 *
 * StatsCan CSVs come in two formats:
 * 1. Standard format: one row per data point with COORDINATE and VALUE columns
 * 2. Transposed format: the last dimension's members become column headers
 *    (used by Census Profile and some other tables)
 *
 * This parser handles both formats and yields normalized data point rows.
 */

import { createReadStream } from "fs";
import { createInterface } from "readline";

export interface RawDataPoint {
  refDate: string;
  geoName: string;
  dguid: string;
  coordinate: string; // dot-delimited, e.g., "1.3.1.1"
  vector?: string;
  value: number | null;
  uomId?: number;
  scalarId?: number;
  status?: string;
  symbol?: string;
  decimals?: number;
}

/**
 * Parse a standard StatsCan CSV where each row is one data point.
 *
 * Expected columns (case-insensitive):
 * REF_DATE, GEO, DGUID, [dimension columns...], UOM, UOM_ID,
 * SCALAR_FACTOR, SCALAR_ID, VECTOR, COORDINATE, VALUE, STATUS, SYMBOL, TERMINATED, DECIMALS
 */
export async function* parseStandardCsv(
  filePath: string,
): AsyncGenerator<RawDataPoint> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirst = true;

  for await (const rawLine of rl) {
    // Remove BOM if present
    const line = isFirst ? rawLine.replace(/^\uFEFF/, "") : rawLine;

    const fields = parseCsvLine(line);

    if (isFirst) {
      headers = fields.map((h) => h.trim().toUpperCase().replace(/"/g, ""));
      isFirst = false;
      continue;
    }

    const row = mapFields(headers, fields);

    const valueStr = row["VALUE"];
    const value =
      valueStr !== undefined && valueStr !== "" && valueStr !== ".."
        ? parseFloat(valueStr)
        : null;

    yield {
      refDate: row["REF_DATE"] || "",
      geoName: row["GEO"] || "",
      dguid: row["DGUID"] || "",
      coordinate: row["COORDINATE"] || "",
      vector: row["VECTOR"] || undefined,
      value: value !== null && !isNaN(value) ? value : null,
      uomId: row["UOM_ID"] ? parseInt(row["UOM_ID"]) : undefined,
      scalarId: row["SCALAR_ID"] ? parseInt(row["SCALAR_ID"]) : undefined,
      status: row["STATUS"] || undefined,
      symbol: row["SYMBOL"] || undefined,
      decimals: row["DECIMALS"] ? parseInt(row["DECIMALS"]) : undefined,
    };
  }
}

/**
 * Parse a transposed StatsCan CSV (Census Profile format).
 *
 * In this format, the last dimension's member values become column headers.
 * Each row represents one combination of the non-transposed dimensions,
 * with the transposed member values spread across columns.
 *
 * The function yields one RawDataPoint per (row × transposed-member).
 *
 * @param filePath Path to the CSV file
 * @param memberColumns Map of column header → member_id for the transposed dimension
 */
export async function* parseTransposedCsv(
  filePath: string,
  memberColumns: Map<string, number>,
): AsyncGenerator<RawDataPoint> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] = [];
  let isFirst = true;

  for await (const rawLine of rl) {
    const line = isFirst ? rawLine.replace(/^\uFEFF/, "") : rawLine;
    const fields = parseCsvLine(line);

    if (isFirst) {
      headers = fields.map((h) => h.trim().replace(/"/g, ""));
      isFirst = false;
      continue;
    }

    const row = mapFields(headers, fields);

    const refDate = row["REF_DATE"] || "";
    const geoName = row["GEO"] || "";
    const dguid = row["DGUID"] || "";
    const baseCoordinate = row["COORDINATE"] || "";
    // For each transposed member column, emit a data point
    for (const [colName, memberId] of memberColumns) {
      const valueStr = row[colName];
      if (valueStr === undefined) continue;

      const value =
        valueStr !== "" && valueStr !== ".." ? parseFloat(valueStr) : null;

      // Build full coordinate by appending the member ID to the base coordinate
      const fullCoordinate = baseCoordinate
        ? `${baseCoordinate}.${memberId}`
        : String(memberId);

      // Check for a symbol column (StatsCan names them "Symbol N" where N matches)
      const symbolCol = `Symbol ${memberId}`;
      const symbol = row[symbolCol] || undefined;

      yield {
        refDate,
        geoName,
        dguid,
        coordinate: fullCoordinate,
        value: value !== null && !isNaN(value) ? value : null,
        symbol,
      };
    }
  }
}

/**
 * Parse a single CSV line handling quoted fields with commas and escaped quotes.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function mapFields(
  headers: string[],
  fields: string[],
): Record<string, string> {
  const row: Record<string, string> = {};
  for (let i = 0; i < headers.length && i < fields.length; i++) {
    row[headers[i]] = fields[i];
  }
  return row;
}

/**
 * Count lines in a file (for progress reporting).
 */
export async function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;
    const stream = createReadStream(filePath, { encoding: "utf-8" });
    stream.on("data", (chunk) => {
      const text = String(chunk);
      for (let i = 0; i < text.length; i++) {
        if (text[i] === "\n") count++;
      }
    });
    stream.on("end", () => resolve(count));
    stream.on("error", reject);
  });
}

/**
 * Detect whether a CSV uses standard or transposed format.
 * Standard CSVs have a COORDINATE column and VALUE column.
 * Transposed CSVs have a COORDINATE column but no VALUE column
 * (the values are spread across member-named columns).
 */
export async function detectCsvFormat(
  filePath: string,
): Promise<"standard" | "transposed"> {
  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  });

  for await (const rawLine of rl) {
    const line = rawLine.replace(/^\uFEFF/, "");
    const headers = parseCsvLine(line).map((h) =>
      h.trim().toUpperCase().replace(/"/g, ""),
    );
    rl.close();

    if (headers.includes("VALUE")) {
      return "standard";
    }
    return "transposed";
  }

  return "standard";
}
