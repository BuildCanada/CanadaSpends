// Transform Statement of Operations data to SankeyData format

import type { SankeyData, SankeyNode } from "@/components/Sankey/SankeyChartD3";
import type { StatementOfOperations, StatementLineItem } from "./types";

// Local type that matches the SankeyNode shape we create
interface LocalSankeyNode {
  id: string;
  displayName: string;
  name: string;
  amount: number;
}

/**
 * Get the most recent actual value from a line item
 * Looks for actual_YYYY keys (not budget) and returns the most recent one
 */
function getActualValue(item: StatementLineItem, year: number): number {
  // Try the specific year first
  const actualKey = `actual_${year}`;
  if (item.values[actualKey] !== null && item.values[actualKey] !== undefined) {
    return item.values[actualKey] as number;
  }

  // Fallback to any actual value
  for (const [key, value] of Object.entries(item.values)) {
    if (key.startsWith("actual_") && value !== null && value !== undefined) {
      return value as number;
    }
  }

  return 0;
}

/**
 * Convert Statement of Operations data to SankeyData format
 * compatible with the JurisdictionSankey component
 */
export function statementOfOperationsToSankey(
  data: StatementOfOperations,
): SankeyData {
  // Determine the fiscal year from the data
  const fiscalYear =
    data.fiscal_periods?.find((p) => !p.is_budget)?.year || 2024;

  // Filter line items by category
  const revenueItems = data.line_items.filter(
    (item) =>
      item.major_category === "revenue" && !item.is_total && !item.is_subtotal,
  );

  const expenseItems = data.line_items.filter(
    (item) =>
      item.major_category === "expenditures" &&
      !item.is_total &&
      !item.is_subtotal,
  );

  // Get totals
  const totalRevenueItem = data.line_items.find(
    (item) => item.major_category === "revenue" && item.is_total,
  );

  const totalExpenseItem = data.line_items.find(
    (item) => item.major_category === "expenditures" && item.is_total,
  );

  // Calculate totals from items or use the total line item
  const totalRevenue = totalRevenueItem
    ? getActualValue(totalRevenueItem, fiscalYear)
    : revenueItems.reduce(
        (sum, item) => sum + getActualValue(item, fiscalYear),
        0,
      );

  const totalExpenses = totalExpenseItem
    ? getActualValue(totalExpenseItem, fiscalYear)
    : expenseItems.reduce(
        (sum, item) => sum + getActualValue(item, fiscalYear),
        0,
      );

  // Build revenue tree
  const revenueChildren: SankeyNode[] = revenueItems
    .map((item, index): LocalSankeyNode | null => {
      const amount = getActualValue(item, fiscalYear);
      if (amount <= 0) return null;

      return {
        id: `revenue_${index}_${item.name.replace(/\s+/g, "_").toLowerCase()}`,
        displayName: item.name,
        name: item.name,
        amount,
      };
    })
    .filter((node): node is LocalSankeyNode => node !== null);

  const revenueData: SankeyNode = {
    id: "revenue_root",
    displayName: "Total Revenue",
    name: "Total Revenue",
    amount: totalRevenue,
    children: revenueChildren,
  };

  // Build spending/expense tree
  const spendingChildren: SankeyNode[] = expenseItems
    .map((item, index): LocalSankeyNode | null => {
      const amount = getActualValue(item, fiscalYear);
      if (amount <= 0) return null;

      return {
        id: `spending_${index}_${item.name.replace(/\s+/g, "_").toLowerCase()}`,
        displayName: item.name,
        name: item.name,
        amount,
      };
    })
    .filter((node): node is LocalSankeyNode => node !== null);

  const spendingData: SankeyNode = {
    id: "spending_root",
    displayName: "Total Expenses",
    name: "Total Expenses",
    amount: totalExpenses,
    children: spendingChildren,
  };

  return {
    total: Math.max(totalRevenue, totalExpenses),
    spending: totalExpenses,
    revenue: totalRevenue,
    spending_data: spendingData,
    revenue_data: revenueData,
  };
}

/**
 * Extract summary values from statement of operations
 */
export function extractOperationsSummary(
  data: StatementOfOperations,
  year?: number,
): {
  totalRevenue: number;
  totalExpenses: number;
  surplusDeficit: number;
} {
  const fiscalYear =
    year || data.fiscal_periods?.find((p) => !p.is_budget)?.year || 2024;

  const totalRevenueItem = data.line_items.find(
    (item) => item.major_category === "revenue" && item.is_total,
  );

  const totalExpenseItem = data.line_items.find(
    (item) => item.major_category === "expenditures" && item.is_total,
  );

  const netRevenueItem = data.line_items.find(
    (item) =>
      item.major_category === "summary" &&
      item.name.toLowerCase().includes("net revenue"),
  );

  const totalRevenue = totalRevenueItem
    ? getActualValue(totalRevenueItem, fiscalYear)
    : 0;

  const totalExpenses = totalExpenseItem
    ? getActualValue(totalExpenseItem, fiscalYear)
    : 0;

  const surplusDeficit = netRevenueItem
    ? getActualValue(netRevenueItem, fiscalYear)
    : totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    surplusDeficit,
  };
}

/**
 * Create empty/placeholder SankeyData when no data is available
 */
export function createEmptySankeyData(): SankeyData {
  return {
    total: 0,
    spending: 0,
    revenue: 0,
    spending_data: {
      id: "spending_root",
      displayName: "No Data",
      name: "No Data",
      amount: 0,
    },
    revenue_data: {
      id: "revenue_root",
      displayName: "No Data",
      name: "No Data",
      amount: 0,
    },
  };
}
