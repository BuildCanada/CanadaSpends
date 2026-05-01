import {
  calculateBracketTax,
  calculateCappedContribution,
  calculateCpp2Contribution,
  calculateFederalAbatement,
  calculateHealthPremium,
  calculateSurtax,
} from "./calculators";
import { getTaxConfig } from "./configs";
import {
  DetailedTaxCalculation,
  TaxCalculation,
  TaxLineItem,
  TaxYearProvinceConfig,
} from "./types";

/**
 * Calculate detailed tax breakdown for a given income, province, and year
 */
export function calculateDetailedTax(
  income: number,
  province: string = "ontario",
  year: string = "2024",
): DetailedTaxCalculation {
  const config = getTaxConfig(year, province);

  if (!config) {
    throw new Error(
      `Tax configuration not found for year "${year}" and province "${province}"`,
    );
  }

  return calculateWithConfig(income, config);
}

/**
 * Calculate tax using a specific configuration
 */
function calculateWithConfig(
  income: number,
  config: TaxYearProvinceConfig,
): DetailedTaxCalculation {
  const lineItems: TaxLineItem[] = [];

  // Resolve province-level overrides for pension plan and EI
  // (e.g., Quebec residents pay QPP instead of CPP, and a reduced EI rate
  // because Quebec administers QPIP).
  const pensionConfig =
    config.provincial.pensionPlanOverride ?? config.federal.cpp;
  const pensionAdditionalConfig =
    config.provincial.pensionPlanAdditionalOverride ?? config.federal.cpp2;
  const eiConfig = config.provincial.eiOverride ?? config.federal.ei;
  const parentalInsuranceConfig = config.provincial.parentalInsurance;
  // The pension plan is a provincial program when the province administers
  // its own (e.g., Quebec's QPP via Retraite Québec).
  const pensionLevel: "federal" | "provincial" = config.provincial
    .pensionPlanOverride
    ? "provincial"
    : "federal";

  // Federal income tax
  const federalIncomeTax = calculateBracketTax(
    income,
    config.federal.incomeTax,
  );
  lineItems.push({
    id: "federal-income-tax",
    name: "Federal Income Tax",
    level: "federal",
    amount: federalIncomeTax,
    effectiveRate: income > 0 ? (federalIncomeTax / income) * 100 : 0,
    category: "incomeTax",
  });

  // EI contribution (Quebec residents pay a reduced rate; see eiConfig)
  const eiContribution = calculateCappedContribution(income, eiConfig);
  lineItems.push({
    id: "ei-contribution",
    name: eiConfig.name,
    level: "federal",
    amount: eiContribution,
    effectiveRate: income > 0 ? (eiContribution / income) * 100 : 0,
    category: "ei",
  });

  // Pension plan contribution (CPP for most provinces, QPP for Quebec)
  const cppContribution = calculateCappedContribution(income, pensionConfig);
  lineItems.push({
    id: "cpp-contribution",
    name: pensionConfig.name,
    level: pensionLevel,
    amount: cppContribution,
    effectiveRate: income > 0 ? (cppContribution / income) * 100 : 0,
    category: "cpp",
  });

  // Second additional pension contribution (CPP2 / QPP2)
  const cpp2Contribution = calculateCpp2Contribution(
    income,
    pensionAdditionalConfig,
  );
  if (cpp2Contribution > 0) {
    lineItems.push({
      id: "cpp2-contribution",
      name: pensionAdditionalConfig.name,
      level: pensionLevel,
      amount: cpp2Contribution,
      effectiveRate: income > 0 ? (cpp2Contribution / income) * 100 : 0,
      category: "cpp2",
    });
  }

  // Provincial parental insurance (Quebec QPIP)
  let parentalInsuranceContribution = 0;
  if (parentalInsuranceConfig) {
    parentalInsuranceContribution = calculateCappedContribution(
      income,
      parentalInsuranceConfig,
    );
    if (parentalInsuranceContribution > 0) {
      lineItems.push({
        id: "parental-insurance-contribution",
        name: parentalInsuranceConfig.name,
        level: "provincial",
        amount: parentalInsuranceContribution,
        effectiveRate:
          income > 0 ? (parentalInsuranceContribution / income) * 100 : 0,
        category: "parentalInsurance",
      });
    }
  }

  // Provincial income tax
  const provincialIncomeTax = calculateBracketTax(
    income,
    config.provincial.incomeTax,
  );
  const provinceName =
    config.province.charAt(0).toUpperCase() + config.province.slice(1);
  lineItems.push({
    id: "provincial-income-tax",
    name: `${provinceName} Income Tax`,
    level: "provincial",
    amount: provincialIncomeTax,
    effectiveRate: income > 0 ? (provincialIncomeTax / income) * 100 : 0,
    category: "incomeTaxProvincial",
  });

  // Provincial surtax (if applicable)
  let surtax = 0;
  if (config.provincial.surtax) {
    surtax = calculateSurtax(provincialIncomeTax, config.provincial.surtax);
    if (surtax > 0) {
      lineItems.push({
        id: "provincial-surtax",
        name: `${provinceName} Surtax`,
        level: "provincial",
        amount: surtax,
        effectiveRate: income > 0 ? (surtax / income) * 100 : 0,
        category: "surtax",
      });
    }
  }

  // Health premium (if applicable)
  let healthPremium = 0;
  if (config.provincial.healthPremium) {
    healthPremium = calculateHealthPremium(
      income,
      config.provincial.healthPremium,
    );
    if (healthPremium > 0) {
      lineItems.push({
        id: "health-premium",
        name: `${provinceName} Health Premium`,
        level: "provincial",
        amount: healthPremium,
        effectiveRate: income > 0 ? (healthPremium / income) * 100 : 0,
        category: "healthPremium",
      });
    }
  }

  // Federal abatement (Quebec Abatement - reduces federal tax for Quebec residents)
  let federalAbatement = 0;
  if (config.provincial.federalAbatement) {
    federalAbatement = calculateFederalAbatement(
      federalIncomeTax,
      config.provincial.federalAbatement,
    );
    if (federalAbatement > 0) {
      lineItems.push({
        id: "federal-abatement",
        name: config.provincial.federalAbatement.name,
        level: "federal",
        amount: -federalAbatement, // Negative to show as a tax credit/reduction
        effectiveRate: income > 0 ? (-federalAbatement / income) * 100 : 0,
        category: "federalAbatement",
      });
    }
  }

  // Calculate totals. Pension contributions count toward provincial tax
  // when the province administers its own plan (e.g., Quebec QPP/QPP2),
  // and toward federal tax otherwise (CPP/CPP2).
  const pensionFederalAmount =
    pensionLevel === "federal" ? cppContribution + cpp2Contribution : 0;
  const pensionProvincialAmount =
    pensionLevel === "provincial" ? cppContribution + cpp2Contribution : 0;
  const federalTax =
    federalIncomeTax + eiContribution + pensionFederalAmount - federalAbatement;
  const provincialTax =
    provincialIncomeTax +
    surtax +
    healthPremium +
    parentalInsuranceContribution +
    pensionProvincialAmount;
  const totalTax = federalTax + provincialTax;
  const netIncome = income - totalTax;
  const effectiveTaxRate = income > 0 ? (totalTax / income) * 100 : 0;

  return {
    // Summary (backwards compatible)
    grossIncome: income,
    federalTax,
    provincialTax,
    totalTax,
    netIncome,
    effectiveTaxRate,

    // Line items
    lineItems,

    // Individual totals
    federalIncomeTax,
    provincialIncomeTax,
    eiContribution,
    cppContribution,
    cpp2Contribution,
    parentalInsuranceContribution,
    surtax,
    healthPremium,
    federalAbatement,

    // Metadata
    year: config.year,
    province: config.province,
  };
}

/**
 * Calculate total tax - backwards compatible with old API
 */
export function calculateTotalTax(
  income: number,
  province: string = "ontario",
  year: string = "2024",
): TaxCalculation {
  const detailed = calculateDetailedTax(income, province, year);

  return {
    grossIncome: detailed.grossIncome,
    federalTax: detailed.federalTax,
    provincialTax: detailed.provincialTax,
    totalTax: detailed.totalTax,
    netIncome: detailed.netIncome,
    effectiveTaxRate: detailed.effectiveTaxRate,
  };
}

/**
 * Format currency in CAD
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercentage(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
