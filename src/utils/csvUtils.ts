import type { SearchResult } from "../types/search"; // Import SearchResult if needed for types within utils

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const escapeCsvField = (field: any): string => {
  const stringField = String(field ?? "");
  if (
    stringField.includes(",") ||
    stringField.includes('"') ||
    stringField.includes("\n")
  ) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
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
