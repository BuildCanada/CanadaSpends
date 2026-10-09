import {
  getDefaultYear,
  getSpendingConfig,
  SpendingCategoryConfig,
  TaxCalculation,
} from "./tax";

export interface SpendingCategory {
  name: string;
  amount: number;
  percentage: number;
  formattedAmount: string;
  formattedPercentage: string;
  level: "federal" | "provincial";
}

export interface PersonalTaxBreakdown {
  taxCalculation: TaxCalculation;
  federalSpending: SpendingCategory[];
  provincialSpending: SpendingCategory[];
  combinedSpending: SpendingCategory[];
  combinedChartData: CombinedSpendingItem[];
}

export interface CombinedSpendingItem {
  name: string;
  federalAmount: number;
  provincialAmount: number;
  totalAmount: number;
  formattedTotal: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

function calculateSpendingByCategory(
  taxAmount: number,
  categories: SpendingCategoryConfig[],
  level: "federal" | "provincial",
): SpendingCategory[] {
  return categories.map((category) => {
    const amount = (taxAmount * category.percentage) / 100;
    return {
      name: category.name,
      amount,
      percentage: category.percentage,
      formattedAmount: formatCurrency(amount),
      formattedPercentage: formatPercentage(category.percentage),
      level,
    };
  });
}

function groupSmallAmounts(
  categories: SpendingCategory[],
  threshold: number = 20,
): SpendingCategory[] {
  const largeCategories = categories.filter(
    (cat) => cat.amount >= threshold && cat.name !== "Other",
  );
  const smallCategories = categories.filter(
    (cat) => cat.amount < threshold && cat.name !== "Other",
  );
  const existingOther = categories.find((cat) => cat.name === "Other");

  // Sort large categories by amount (descending)
  const sortedLargeCategories = largeCategories.sort(
    (a, b) => b.amount - a.amount,
  );

  // If there are small categories or an existing "Other", create/update the Other category
  if (smallCategories.length > 0 || existingOther) {
    const otherCategory: SpendingCategory = {
      name: "Other",
      amount:
        smallCategories.reduce((sum, cat) => sum + cat.amount, 0) +
        (existingOther?.amount || 0),
      percentage:
        smallCategories.reduce((sum, cat) => sum + cat.percentage, 0) +
        (existingOther?.percentage || 0),
      formattedAmount: "",
      formattedPercentage: "",
      level: existingOther?.level || smallCategories[0]?.level || "federal",
    };

    otherCategory.formattedAmount = formatCurrency(otherCategory.amount);
    otherCategory.formattedPercentage = formatPercentage(
      otherCategory.percentage,
    );

    // Return large categories first, then "Other" at the end
    return [...sortedLargeCategories, otherCategory];
  }

  return sortedLargeCategories;
}

function combineFederalAndProvincialForChart(
  federalSpending: SpendingCategory[],
  provincialSpending: SpendingCategory[],
  federalTransferName: string,
  allTransferNames: Set<string>,
): CombinedSpendingItem[] {
  const combined: { [key: string]: { federal: number; provincial: number } } =
    {};

  let otherProvincesTransferAmount = 0;

  // Add federal spending
  federalSpending.forEach((category) => {
    // Skip the current province's transfer (it's included in provincial spending)
    if (category.name === federalTransferName) {
      return;
    }

    // Combine all other provincial transfers into "Transfers to Other Provinces"
    if (
      allTransferNames.has(category.name) ||
      category.name === "Transfers to Other Provinces"
    ) {
      otherProvincesTransferAmount += category.amount;
    } else {
      if (!combined[category.name]) {
        combined[category.name] = { federal: 0, provincial: 0 };
      }
      combined[category.name].federal = category.amount;
    }
  });

  // Add the combined "Transfers to Other Provinces" if there's any amount
  if (otherProvincesTransferAmount > 0) {
    combined["Transfers to Other Provinces"] = {
      federal: otherProvincesTransferAmount,
      provincial: 0,
    };
  }

  // Add provincial spending
  provincialSpending.forEach((category) => {
    if (!combined[category.name]) {
      combined[category.name] = { federal: 0, provincial: 0 };
    }
    combined[category.name].provincial = category.amount;
  });

  // Convert to array format
  const result = Object.entries(combined).map(([name, amounts]) => ({
    name,
    federalAmount: amounts.federal,
    provincialAmount: amounts.provincial,
    totalAmount: amounts.federal + amounts.provincial,
    formattedTotal: formatCurrency(amounts.federal + amounts.provincial),
  }));

  // Sort by total amount (descending) and ensure "Other" is last
  return result.sort((a, b) => {
    if (a.name === "Other") return 1;
    if (b.name === "Other") return -1;
    return b.totalAmount - a.totalAmount;
  });
}

function combineFederalAndProvincial(
  federalSpending: SpendingCategory[],
  provincialSpending: SpendingCategory[],
  federalTransferName: string,
  allTransferNames: Set<string>,
): SpendingCategory[] {
  const combined: { [key: string]: SpendingCategory } = {};

  let otherProvincesTransferAmount = 0;
  let otherProvincesTransferPercentage = 0;

  // Add federal spending
  federalSpending.forEach((category) => {
    // Skip the current province's transfer (it's included in provincial spending)
    if (category.name === federalTransferName) {
      return;
    }

    // Combine all other provincial transfers into "Transfers to Other Provinces"
    if (
      allTransferNames.has(category.name) ||
      category.name === "Transfers to Other Provinces"
    ) {
      otherProvincesTransferAmount += category.amount;
      otherProvincesTransferPercentage += category.percentage;
    } else {
      combined[category.name] = {
        ...category,
        level: "federal" as const,
      };
    }
  });

  // Add the combined "Transfers to Other Provinces" if there's any amount
  if (otherProvincesTransferAmount > 0) {
    combined["Transfers to Other Provinces"] = {
      name: "Transfers to Other Provinces",
      amount: otherProvincesTransferAmount,
      percentage: otherProvincesTransferPercentage,
      formattedAmount: formatCurrency(otherProvincesTransferAmount),
      formattedPercentage: formatPercentage(otherProvincesTransferPercentage),
      level: "federal" as const,
    };
  }

  // Add or merge provincial spending
  provincialSpending.forEach((category) => {
    if (combined[category.name]) {
      // Merge categories with same name
      combined[category.name] = {
        name: category.name,
        amount: combined[category.name].amount + category.amount,
        percentage: 0, // Will recalculate
        formattedAmount: "",
        formattedPercentage: "",
        level: "federal" as const, // Use federal as primary for combined
      };
    } else {
      combined[category.name] = {
        ...category,
        level: "provincial" as const,
      };
    }
  });

  // Convert back to array and recalculate percentages
  const totalAmount = Object.values(combined).reduce(
    (sum, cat) => sum + cat.amount,
    0,
  );

  return Object.values(combined)
    .map((category) => ({
      ...category,
      percentage: totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0,
      formattedAmount: formatCurrency(category.amount),
      formattedPercentage: formatPercentage(
        totalAmount > 0 ? (category.amount / totalAmount) * 100 : 0,
      ),
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Known transfer names for all provinces
const ALL_TRANSFER_NAMES = new Set([
  "Transfer to Ontario",
  "Transfer to Alberta",
]);

export function calculatePersonalTaxBreakdown(
  taxCalculation: TaxCalculation,
  province: string = "ontario",
  year: string = getDefaultYear(),
): PersonalTaxBreakdown | null {
  // Get spending config from the year-specific configuration
  const spendingConfig = getSpendingConfig(year, province);

  if (!spendingConfig) {
    // Return null to allow the UI to show a "coming soon" message
    return null;
  }

  // Calculate federal spending breakdown
  const federalSpending = calculateSpendingByCategory(
    taxCalculation.federalTax,
    spendingConfig.federal,
    "federal",
  );

  // Find the transfer amount for this province
  const transferCategory = federalSpending.find(
    (cat) => cat.name === spendingConfig.federalTransferName,
  );
  const transferAmount = transferCategory ? transferCategory.amount : 0;

  // Calculate provincial spending breakdown (including transferred federal funds)
  const totalProvincialFunds = taxCalculation.provincialTax + transferAmount;
  const provincialSpending = calculateSpendingByCategory(
    totalProvincialFunds,
    spendingConfig.provincial,
    "provincial",
  );

  // Group small amounts
  const federalSpendingGrouped = groupSmallAmounts(federalSpending);
  const provincialSpendingGrouped = groupSmallAmounts(provincialSpending);

  // Create combined view
  const combinedSpending = groupSmallAmounts(
    combineFederalAndProvincial(
      federalSpending,
      provincialSpending,
      spendingConfig.federalTransferName,
      ALL_TRANSFER_NAMES,
    ),
  );

  // Create combined chart data for stacked bars
  const combinedChartData = combineFederalAndProvincialForChart(
    federalSpendingGrouped,
    provincialSpendingGrouped,
    spendingConfig.federalTransferName,
    ALL_TRANSFER_NAMES,
  );

  return {
    taxCalculation,
    federalSpending: federalSpendingGrouped,
    provincialSpending: provincialSpendingGrouped,
    combinedSpending,
    combinedChartData,
  };
}
