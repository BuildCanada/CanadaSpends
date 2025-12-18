import { TaxCalculation } from "./taxCalculator";

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

// Federal spending categories with percentages (from existing Sankey data)
// Transfer to Ontario: 6.02%, Transfer to Alberta: 2.30%, Transfer to BC: 2.80%, Other Provinces: 8.38% (reduced from 11.18)
const FEDERAL_SPENDING_CATEGORIES = [
  { name: "Retirement Benefits", percentage: 14.8 },
  { name: "Children, Community and Social Services", percentage: 5.1 },
  { name: "Employment Insurance", percentage: 4.5 },
  { name: "Transfer to Ontario", percentage: 6.02 },
  { name: "Transfer to Alberta", percentage: 2.3 },
  { name: "Transfer to British Columbia", percentage: 2.8 },
  { name: "Transfers to Other Provinces", percentage: 8.38 },
  { name: "Interest on Debt", percentage: 9.2 },
  { name: "Indigenous Priorities", percentage: 8.3 },
  { name: "Defence", percentage: 6.7 },
  { name: "Public Safety", percentage: 4.4 },
  { name: "International Affairs", percentage: 3.7 },
  {
    name: "Standard of Living, including training, carbon tax rebate, and other supports",
    percentage: 12.0,
  },
  { name: "Health", percentage: 2.7 },
  { name: "Innovation and Research", percentage: 1.8 },
  { name: "Infrastructure", percentage: 1.8 },
  { name: "Transportation", percentage: 1.0 },
  { name: "Natural Resources", percentage: 1.0 },
  { name: "Fisheries and Agriculture", percentage: 1.7 },
  { name: "Environment", percentage: 0.8 },
  { name: "Other", percentage: 1.0 },
];

// Ontario spending categories with percentages (from Sankey data)
const ONTARIO_SPENDING_CATEGORIES = [
  { name: "Health", percentage: 40.1 },
  { name: "K-12 Education", percentage: 18.8 },
  { name: "Children, Community and Social Services", percentage: 9.4 },
  { name: "Interest on Debt", percentage: 5.5 },
  { name: "Colleges and Universities", percentage: 6.4 },
  { name: "Transportation", percentage: 3.6 },
  { name: "Energy", percentage: 3.1 },
  { name: "Attorney and Solicitor General", percentage: 2.9 },
  { name: "Infrastructure", percentage: 1.3 },
  { name: "Long-Term Care", percentage: 1.2 },
  { name: "Finance", percentage: 0.9 },
  { name: "Tourism, Culture, and Sport", percentage: 0.9 },
  { name: "Municipal Affairs and Housing", percentage: 0.9 },
  { name: "Labour and Skills Development", percentage: 0.8 },
  { name: "Treasury Board Secretariat", percentage: 0.7 },
  { name: "Economic Development and Trade", percentage: 0.6 },
  { name: "Natural Resources", percentage: 0.5 },
  { name: "Fisheries and Agriculture", percentage: 0.5 },
  { name: "Other", percentage: 1.9 },
];

const ALBERTA_SPENDING_CATEGORIES = [
  { name: "Health", percentage: 35.7 },
  { name: "K-12 Education", percentage: 12.6 },
  { name: "Colleges and Universities", percentage: 8.8 },
  { name: "Children, Community and Social Services", percentage: 7.6 },
  { name: "Interest on Debt", percentage: 7.5 },
  { name: "Fisheries and Agriculture", percentage: 3.7 },
  { name: "Transportation", percentage: 2.1 },
  { name: "Public Safety", percentage: 2.1 },
  { name: "Economic Development and Trade", percentage: 2.2 },
  { name: "Energy", percentage: 1.4 },
  { name: "Municipal Affairs and Housing", percentage: 1.4 },
  { name: "Innovation and Research", percentage: 1.0 },
  { name: "Attorney and Solicitor General", percentage: 0.9 },
  { name: "Infrastructure", percentage: 0.7 },
  { name: "Forestry and Parks", percentage: 1.6 },
  { name: "Environment", percentage: 0.5 },
  { name: "Indigenous Priorities", percentage: 0.3 },
  { name: "Tourism, Culture, and Sport", percentage: 0.6 },
  { name: "Other", percentage: 8.7 },
];

const BC_SPENDING_CATEGORIES = [
  { name: "Health", percentage: 43.2 },
  { name: "K-12 Education", percentage: 12.7 },
  { name: "Other Appropriations", percentage: 9.7 },
  { name: "Children, Community and Social Services", percentage: 6.7 },
  { name: "Colleges and Universities", percentage: 4.5 },
  { name: "Finance and Debt", percentage: 3.4 },
  { name: "Children and Family Development", percentage: 3.1 },
  { name: "Interest on Debt", percentage: 3.0 },
  { name: "Municipal Affairs and Housing", percentage: 2.3 },
  { name: "Transportation", percentage: 1.9 },
  { name: "Forestry and Parks", percentage: 1.8 },
  { name: "Public Safety", percentage: 1.5 },
  { name: "Attorney and Solicitor General", percentage: 1.1 },
  { name: "Citizens' Services", percentage: 1.0 },
  { name: "Energy", percentage: 0.7 },
  { name: "Emergency Management", percentage: 0.6 },
  { name: "Water and Resource Stewardship", percentage: 0.4 },
  { name: "Fisheries and Agriculture", percentage: 0.4 },
  { name: "Indigenous Priorities", percentage: 0.4 },
  { name: "Environment", percentage: 0.3 },
  { name: "Tourism, Culture, and Sport", percentage: 0.3 },
  { name: "Economic Development and Trade", percentage: 0.3 },
  { name: "Other", percentage: 5.8 },
];

// Consolidated province configuration
const PROVINCE_DATA: Record<
  string,
  {
    federalTransferName: string;
    spendingCategories: { name: string; percentage: number }[];
  }
> = {
  ontario: {
    federalTransferName: "Transfer to Ontario",
    spendingCategories: ONTARIO_SPENDING_CATEGORIES,
  },
  alberta: {
    federalTransferName: "Transfer to Alberta",
    spendingCategories: ALBERTA_SPENDING_CATEGORIES,
  },
  "british-columbia": {
    federalTransferName: "Transfer to British Columbia",
    spendingCategories: BC_SPENDING_CATEGORIES,
  },
};

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
  categories: { name: string; percentage: number }[],
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

export interface CombinedSpendingItem {
  name: string;
  federalAmount: number;
  provincialAmount: number;
  totalAmount: number;
  formattedTotal: string;
}

function combineFederalAndProvincialForChart(
  federalSpending: SpendingCategory[],
  provincialSpending: SpendingCategory[],
  currentProvince: string,
): CombinedSpendingItem[] {
  const combined: { [key: string]: { federal: number; provincial: number } } =
    {};

  // Get the current province's transfer name to exclude
  const currentProvinceConfig = PROVINCE_DATA[currentProvince];
  const currentProvinceTransferName =
    currentProvinceConfig?.federalTransferName;

  // Get all federal transfer names for combining into "Transfers to Other Provinces"
  const allTransferNames = new Set(
    Object.values(PROVINCE_DATA).map((p) => p.federalTransferName),
  );

  let otherProvincesTransferAmount = 0;

  // Add federal spending
  federalSpending.forEach((category) => {
    // Skip the current province's transfer (it's included in provincial spending)
    if (category.name === currentProvinceTransferName) {
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
  currentProvince: string,
): SpendingCategory[] {
  const combined: { [key: string]: SpendingCategory } = {};

  // Get the current province's transfer name to exclude
  const currentProvinceConfig = PROVINCE_DATA[currentProvince];
  const currentProvinceTransferName =
    currentProvinceConfig?.federalTransferName;

  // Get all federal transfer names for combining into "Transfers to Other Provinces"
  const allTransferNames = new Set(
    Object.values(PROVINCE_DATA).map((p) => p.federalTransferName),
  );

  let otherProvincesTransferAmount = 0;
  let otherProvincesTransferPercentage = 0;

  // Add federal spending
  federalSpending.forEach((category) => {
    // Skip the current province's transfer (it's included in provincial spending)
    if (category.name === currentProvinceTransferName) {
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

export function calculatePersonalTaxBreakdown(
  taxCalculation: TaxCalculation,
  province: string = "ontario",
): PersonalTaxBreakdown {
  // Calculate federal spending breakdown
  const federalSpending = calculateSpendingByCategory(
    taxCalculation.federalTax,
    FEDERAL_SPENDING_CATEGORIES,
    "federal",
  );

  // Get province-specific configuration
  const provinceConfig = PROVINCE_DATA[province];
  if (!provinceConfig) {
    throw new Error(`Province "${province}" not supported`);
  }

  // Find the transfer amount for this province
  const transferCategory = federalSpending.find(
    (cat) => cat.name === provinceConfig.federalTransferName,
  );
  const transferAmount = transferCategory ? transferCategory.amount : 0;

  // Calculate provincial spending breakdown (including transferred federal funds)
  const totalProvincialFunds = taxCalculation.provincialTax + transferAmount;
  const provincialSpending = calculateSpendingByCategory(
    totalProvincialFunds,
    provinceConfig.spendingCategories,
    "provincial",
  );

  // Group small amounts
  const federalSpendingGrouped = groupSmallAmounts(federalSpending);
  const provincialSpendingGrouped = groupSmallAmounts(provincialSpending);

  // Create combined view
  const combinedSpending = groupSmallAmounts(
    combineFederalAndProvincial(federalSpending, provincialSpending, province),
  );

  // Create combined chart data for stacked bars
  const combinedChartData = combineFederalAndProvincialForChart(
    federalSpendingGrouped,
    provincialSpendingGrouped,
    province,
  );

  return {
    taxCalculation,
    federalSpending: federalSpendingGrouped,
    provincialSpending: provincialSpendingGrouped,
    combinedSpending,
    combinedChartData,
  };
}
