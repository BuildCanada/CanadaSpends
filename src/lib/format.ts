// Shared number formatting (Canadian dollars, en-CA).

/** Dollars and cents: "$1,234.56" */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Whole dollars: "$1,235" */
export function formatWholeDollars(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** A percentage value (25.3, not 0.253) with one decimal: "25.3%" */
export function formatPercentage(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
