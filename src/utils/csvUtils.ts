import type { SearchResult } from "../types/search"; // Import SearchResult if needed for types within utils

export const escapeCsvField = (field: string): string => {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
};

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return ""; // Return empty string for null or undefined amounts
  }
  // Format as currency, assuming USD/CAD style for now
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const convertResultsToCsv = (results: SearchResult[]): string => {
  if (!results || results.length === 0) {
    return "";
  }
  const headers = [
    "Recipient",
    "Department",
    "Program",
    "Fiscal Year",
    "Amount",
    "Description",
    "Award Type",
    "Sub type",
    "Province",
    "Country",
  ];
  const csvRows = [headers.join(",")];

  results.forEach((hit) => {
    const subType = (hit.type || "").replace("canada-spends.db/", "");
    const row = [
      escapeCsvField(hit.recipient),
      escapeCsvField(hit.payer),
      escapeCsvField(hit.program),
      escapeCsvField(hit.fiscal_year),
      // Use formatCurrency for the amount
      escapeCsvField(formatCurrency(hit.amount)),
      escapeCsvField(hit.description),
      escapeCsvField(hit.award_type),
      escapeCsvField(subType),
      escapeCsvField(hit.province),
      escapeCsvField(hit.country),
    ];
    csvRows.push(row.join(","));
  });
  return csvRows.join("\n");
};

// Improved CSV parser that handles quoted fields
export function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse CSV line with proper quote handling
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim(),
  );

  return lines
    .slice(1)
    .map((line, lineIndex) => {
      try {
        const values = parseLine(line);
        const obj: Record<string, unknown> = {};
        headers.forEach((header, i) => {
          let value = values[i] !== undefined ? values[i] : "";
          // Remove surrounding quotes if present
          value = value.replace(/^"|"$/g, "").trim();
          // Try to convert numbers
          const numValue = parseFloat(value);
          obj[header] = !isNaN(numValue) && value !== "" ? numValue : value;
        });
        return obj;
      } catch {
        console.warn(`Error parsing line ${lineIndex + 2}:`, line);
        return {};
      }
    })
    .filter((obj) => Object.keys(obj).length > 0);
}
