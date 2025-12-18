export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxCalculation {
  grossIncome: number;
  federalTax: number;
  provincialTax: number;
  totalTax: number;
  netIncome: number;
  effectiveTaxRate: number;
}

// 2024 Federal basic personal amount (tax-free threshold)
export const FEDERAL_BASIC_PERSONAL_AMOUNT = 15705;

// 2024 Ontario basic personal amount
export const ONTARIO_BASIC_PERSONAL_AMOUNT = 12399;

// 2024 Alberta basic personal amount
export const ALBERTA_BASIC_PERSONAL_AMOUNT = 21885;

// 2025 British Columbia basic personal amount
export const BC_BASIC_PERSONAL_AMOUNT = 12932;

// 2025 Federal tax brackets
export const FEDERAL_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 57375, rate: 0.145 },
  { min: 57375, max: 114750, rate: 0.205 },
  { min: 114750, max: 177882, rate: 0.26 },
  { min: 177882, max: 253414, rate: 0.29 },
  { min: 253414, max: null, rate: 0.33 },
];

// 2024 Ontario provincial tax brackets
export const ONTARIO_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 51446, rate: 0.0505 },
  { min: 51446, max: 102894, rate: 0.0915 },
  { min: 102894, max: 150000, rate: 0.1116 },
  { min: 150000, max: 220000, rate: 0.1216 },
  { min: 220000, max: null, rate: 0.1316 },
];

// 2024 Alberta provincial tax brackets
export const ALBERTA_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 148269, rate: 0.1 },
  { min: 148269, max: 177922, rate: 0.12 },
  { min: 177922, max: 237230, rate: 0.13 },
  { min: 237230, max: 355845, rate: 0.14 },
  { min: 355845, max: null, rate: 0.15 },
];

// 2025 British Columbia provincial tax brackets
export const BC_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 49279, rate: 0.0506 },
  { min: 49279, max: 98560, rate: 0.077 },
  { min: 98560, max: 113158, rate: 0.105 },
  { min: 113158, max: 137407, rate: 0.1229 },
  { min: 137407, max: 186306, rate: 0.147 },
  { min: 186306, max: 259829, rate: 0.168 },
  { min: 259829, max: null, rate: 0.205 },
];

export function calculateTaxFromBrackets(
  income: number,
  brackets: TaxBracket[],
): number {
  let tax = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) {
      break;
    }

    const taxableInThisBracket = Math.min(
      income - bracket.min,
      bracket.max ? bracket.max - bracket.min : income - bracket.min,
    );

    tax += taxableInThisBracket * bracket.rate;
  }

  return tax;
}

export function calculateFederalTax(income: number): number {
  // Step 1: Calculate tax on full income using progressive brackets
  const taxOnFullIncome = calculateTaxFromBrackets(
    income,
    FEDERAL_TAX_BRACKETS,
  );

  // Step 2: Apply BPA as a credit (14.5% of BPA - lowest federal rate)
  const bpaCredit = FEDERAL_BASIC_PERSONAL_AMOUNT * 0.145;

  // Step 3: Subtract the credit from the calculated tax
  return Math.max(0, taxOnFullIncome - bpaCredit);
}

export function calculateOntarioTax(income: number): number {
  // Step 1: Calculate tax on full income using progressive brackets
  const taxOnFullIncome = calculateTaxFromBrackets(
    income,
    ONTARIO_TAX_BRACKETS,
  );

  // Step 2: Apply BPA as a credit (5.05% of BPA - lowest provincial rate)
  const bpaCredit = ONTARIO_BASIC_PERSONAL_AMOUNT * 0.0505;

  // Step 3: Subtract the credit from the calculated tax
  return Math.max(0, taxOnFullIncome - bpaCredit);
}

function calculateOntarioSurtax(basetax: number): number {
  if (basetax <= 5710) {
    return 0;
  } else if (basetax <= 7307) {
    return 0.2 * (basetax - 5710);
  } else {
    const surtaxAbove5710 = 0.2 * (7307 - 5710);
    const surtaxAbove7307 = 0.36 * (basetax - 7307);
    return surtaxAbove5710 + surtaxAbove7307;
  }
}

function calculateOntarioHealthPm(income: number): number {
  if (income <= 20000) {
    return 0;
  } else if (income > 20000 && income <= 36000) {
    return Math.min(300, 0.06 * (income - 20000));
  } else if (income > 36000 && income <= 48000) {
    const taxAbove36000 = 0.06 * (income - 36000);
    return Math.min(450, 300 + taxAbove36000);
  } else if (income > 48000 && income <= 72000) {
    const taxAbove48000 = 0.25 * (income - 48000);
    return Math.min(600, 450 + taxAbove48000);
  } else if (income > 72000 && income <= 200000) {
    const taxAbove72000 = 0.25 * (income - 72000);
    return Math.min(750, 600 + taxAbove72000);
  } else {
    const taxAbove200000 = 0.25 * (income - 200000);
    return Math.min(750 + taxAbove200000, 900);
  }
}

export function calculateAlbertaTax(income: number): number {
  // Step 1: Calculate tax on full income using progressive brackets
  const taxOnFullIncome = calculateTaxFromBrackets(
    income,
    ALBERTA_TAX_BRACKETS,
  );

  // Step 2: Apply BPA as a credit (10% of BPA - lowest provincial rate)
  const bpaCredit = ALBERTA_BASIC_PERSONAL_AMOUNT * 0.1;

  // Step 3: Subtract the credit from the calculated tax
  return Math.max(0, taxOnFullIncome - bpaCredit);
}

export function calculateBCTax(income: number): number {
  // Step 1: Calculate tax on full income using progressive brackets
  const taxOnFullIncome = calculateTaxFromBrackets(income, BC_TAX_BRACKETS);

  // Step 2: Apply BPA as a credit (5.06% of BPA - lowest provincial rate)
  const bpaCredit = BC_BASIC_PERSONAL_AMOUNT * 0.0506;

  // Step 3: Subtract the credit from the calculated tax
  return Math.max(0, taxOnFullIncome - bpaCredit);
}

export function calculateTotalTax(
  income: number,
  province: string = "ontario",
): TaxCalculation {
  const federalTax = calculateFederalTax(income);

  let provincialTax = 0;
  switch (province.toLowerCase()) {
    case "ontario":
      provincialTax = calculateOntarioTax(income);
      provincialTax += calculateOntarioHealthPm(income);
      provincialTax += calculateOntarioSurtax(provincialTax);
      break;
    case "alberta":
      provincialTax = calculateAlbertaTax(income);
      break;
    case "british-columbia":
    case "british columbia":
    case "bc":
      provincialTax = calculateBCTax(income);
      break;
    default:
      provincialTax = calculateOntarioTax(income); // Default to Ontario for now
      provincialTax += calculateOntarioHealthPm(income);
      provincialTax += calculateOntarioSurtax(provincialTax);
  }

  const totalTax = federalTax + provincialTax;
  const netIncome = income - totalTax;
  const effectiveTaxRate = income > 0 ? (totalTax / income) * 100 : 0;

  return {
    grossIncome: income,
    federalTax,
    provincialTax,
    totalTax,
    netIncome,
    effectiveTaxRate,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
