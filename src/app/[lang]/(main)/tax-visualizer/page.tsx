"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLingui, Trans } from "@lingui/react/macro";

import { CombinedSpendingChart } from "@/components/CombinedSpendingChart";
import { JurisdictionComparisonChart } from "@/components/JurisdictionComparisonChart";
import { H1, H2, PageContent, Section } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { calculatePersonalTaxBreakdown } from "@/lib/personalTaxBreakdown";
import {
  calculateCappedContribution,
  calculateCpp2Contribution,
  calculateDetailedTax,
  calculateHealthPremium,
  calculateSurtax,
  formatCurrency,
  getBracketTaxBreakdown,
  getSupportedYears,
  getTaxConfig,
  SupportedYear,
  TaxYearProvinceConfig,
} from "@/lib/tax";
import { localizedPath } from "@/lib/utils";

// Province display names (sorted alphabetically)
const PROVINCE_NAMES: Record<string, string> = {
  alberta: "Alberta",
  "british-columbia": "British Columbia",
  manitoba: "Manitoba",
  "new-brunswick": "New Brunswick",
  "newfoundland-and-labrador": "Newfoundland and Labrador",
  "northwest-territories": "Northwest Territories",
  "nova-scotia": "Nova Scotia",
  nunavut: "Nunavut",
  ontario: "Ontario",
  "prince-edward-island": "Prince Edward Island",
  quebec: "Quebec",
  saskatchewan: "Saskatchewan",
  yukon: "Yukon",
};

// Provinces sorted alphabetically for dropdown
const PROVINCES_SORTED = Object.entries(PROVINCE_NAMES).sort((a, b) =>
  a[1].localeCompare(b[1]),
);

interface TaxCalculatorFormProps {
  income: number;
  setIncome: (income: number) => void;
  province: string;
  setProvince: (province: string) => void;
  year: SupportedYear;
  setYear: (year: SupportedYear) => void;
}

function TaxCalculatorForm({
  income,
  setIncome,
  province,
  setProvince,
  year,
  setYear,
}: TaxCalculatorFormProps) {
  const { t } = useLingui();
  const supportedYears = getSupportedYears();

  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border">
      <H2>{t`Calculate Your Tax Contribution`}</H2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div>
          <label
            htmlFor="income"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t`Annual Income (CAD)`}
          </label>
          <input
            type="text"
            id="income"
            value={income ? income.toLocaleString() : ""}
            onChange={(e) => {
              const value = e.target.value.replace(/,/g, "");
              const numericValue = Number(value);
              if (!isNaN(numericValue) || value === "") {
                setIncome(numericValue);
              }
            }}
            placeholder={t`100,000`}
            className="w-full bg-input/50 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label
            htmlFor="province"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            {t`Province/Territory`}
          </label>
          <select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-3 py-2 border border-border bg-input/50 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PROVINCES_SORTED.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="year"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            {t`Tax Year`}
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(e.target.value as SupportedYear)}
            className="w-full px-3 py-2 border border-border bg-input/50 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {supportedYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

interface TaxSummaryProps {
  taxCalculation: ReturnType<typeof calculateDetailedTax>;
}

function TaxSummary({ taxCalculation }: TaxSummaryProps) {
  const { t } = useLingui();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title={t`Federal Tax`}
        value={formatCurrency(taxCalculation.federalTax)}
        subtitle={t`Estimated income tax paid to federal government`}
      />
      <StatCard
        title={t`Provincial Tax`}
        value={formatCurrency(taxCalculation.provincialTax)}
        subtitle={t`Estimated income tax paid to provincial government`}
      />
      <StatCard
        title={t`Total Tax`}
        value={formatCurrency(taxCalculation.totalTax)}
        subtitle={t`Estimated combined tax`}
      />
      <StatCard
        title={t`Effective Rate`}
        value={`${taxCalculation.effectiveTaxRate.toFixed(1)}%`}
        subtitle={t`Effective tax rate`}
      />
    </div>
  );
}

// Helper to format currency amounts
function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper to format percentage
function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed((rate * 100) % 1 === 0 ? 0 : 2)}%`;
}

// Income tax brackets section with calculated amounts
function IncomeTaxBracketsSection({
  title,
  config,
  income,
}: {
  title: string;
  config: {
    brackets: Array<{ min: number; max: number | null; rate: number }>;
    basicPersonalAmount: number;
  };
  income: number;
}) {
  const breakdown = getBracketTaxBreakdown(income, config.brackets);
  const lowestRate = config.brackets[0]?.rate ?? 0;
  const bpaCredit = config.basicPersonalAmount * lowestRate;
  const totalBeforeCredit = breakdown.reduce((sum, b) => sum + b.taxAmount, 0);
  const totalAfterCredit = Math.max(0, totalBeforeCredit - bpaCredit);

  return (
    <div>
      <h4 className="font-semibold text-base mb-3">{title}</h4>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="pb-2 font-medium text-sm text-muted-foreground">
              <Trans>Tax bracket</Trans>
            </th>
            <th className="pb-2 font-medium text-sm text-muted-foreground text-right w-20">
              <Trans>Rate</Trans>
            </th>
            <th className="pb-2 font-medium text-sm text-muted-foreground text-right w-20">
              <Trans>Tax</Trans>
            </th>
          </tr>
        </thead>
        <tbody className="text-card-foreground/80 text-sm">
          {breakdown.map((item, index) => (
            <tr
              key={index}
              className={item.taxAmount === 0 ? "opacity-40" : ""}
            >
              <td className="py-1">
                {item.bracket.max === null
                  ? `More than ${formatAmount(item.bracket.min)}`
                  : index === 0
                    ? `First ${formatAmount(item.bracket.max)}`
                    : `${formatAmount(item.bracket.min)} - ${formatAmount(item.bracket.max)}`}
              </td>
              <td className="py-1 text-right">
                {formatPercent(item.bracket.rate)}
              </td>
              <td className="py-1 text-right font-medium">
                {formatAmount(item.taxAmount)}
              </td>
            </tr>
          ))}
          <tr className="border-t border-border">
            <td className="py-1 text-muted-foreground text-xs" colSpan={2}>
              <Trans>
                BPA credit ({formatAmount(config.basicPersonalAmount)} ×{" "}
                {formatPercent(lowestRate)})
              </Trans>
            </td>
            <td className="py-1 text-right font-medium text-red-600">
              -{formatAmount(bpaCredit)}
            </td>
          </tr>
          <tr className="font-semibold">
            <td className="py-1" colSpan={2}>
              <Trans>Total</Trans>
            </td>
            <td className="py-1 text-right">
              {formatAmount(totalAfterCredit)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Federal Tax Card - all federal taxes in one card
interface FederalTaxCardProps {
  config: TaxYearProvinceConfig["federal"];
  provincialConfig: TaxYearProvinceConfig["provincial"];
  income: number;
}

function FederalTaxCard({
  config,
  provincialConfig,
  income,
}: FederalTaxCardProps) {
  // Calculate income tax
  const breakdown = getBracketTaxBreakdown(income, config.incomeTax.brackets);
  const lowestRate = config.incomeTax.brackets[0]?.rate ?? 0;
  const bpaCredit = config.incomeTax.basicPersonalAmount * lowestRate;
  const incomeTaxBeforeCredit = breakdown.reduce(
    (sum, b) => sum + b.taxAmount,
    0,
  );
  const incomeTaxAmount = Math.max(0, incomeTaxBeforeCredit - bpaCredit);

  // Calculate payroll contributions
  const cppAmount = calculateCappedContribution(income, config.cpp);
  const cpp2Amount = calculateCpp2Contribution(income, config.cpp2);
  const eiAmount = calculateCappedContribution(income, config.ei);
  const payrollTotal = cppAmount + cpp2Amount + eiAmount;

  // Calculate federal abatement (Quebec Abatement)
  const federalAbatementConfig = provincialConfig.federalAbatement;
  const federalAbatementAmount = federalAbatementConfig
    ? incomeTaxAmount * federalAbatementConfig.rate
    : 0;

  // Overall total (minus abatement)
  const totalFederalTax =
    incomeTaxAmount + payrollTotal - federalAbatementAmount;

  return (
    <div className="bg-card rounded-lg shadow-sm border p-6 flex flex-col">
      <div className="flex-grow">
        <h3 className="font-bold text-lg mb-4">
          <Trans>Federal Taxes</Trans>
        </h3>

        {/* Income Tax Brackets */}
        <IncomeTaxBracketsSection
          title={config.incomeTax.name}
          config={config.incomeTax}
          income={income}
        />

        {/* Federal Abatement (if applicable) */}
        {federalAbatementConfig && federalAbatementAmount > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-semibold text-base mb-2">
              {federalAbatementConfig.name}
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <Trans>
                  {formatPercent(federalAbatementConfig.rate)} of federal income
                  tax
                </Trans>
              </span>
              <span className="font-medium text-red-600">
                -{formatAmount(federalAbatementAmount)}
              </span>
            </div>
          </div>
        )}

        {/* Payroll Contributions */}
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="font-semibold text-base mb-3">
            <Trans>Payroll Contributions</Trans>
          </h4>
          <table className="w-full text-left text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">
                  <div>{config.cpp.shortName}</div>
                  <div className="text-xs text-muted-foreground/70">
                    {formatAmount(config.cpp.exemption)} -{" "}
                    {formatAmount(config.cpp.maxEarnings)}
                  </div>
                </td>
                <td className="py-1 text-right align-top w-20">
                  {formatPercent(config.cpp.rate)}
                </td>
                <td className="py-1 text-right font-medium align-top w-20">
                  {formatAmount(cppAmount)}
                </td>
              </tr>
              <tr className={cpp2Amount === 0 ? "opacity-40" : ""}>
                <td className="py-1 text-muted-foreground">
                  <div>{config.cpp2.shortName}</div>
                  <div className="text-xs text-muted-foreground/70">
                    {formatAmount(config.cpp2.ympe)} -{" "}
                    {formatAmount(config.cpp2.yampe)}
                  </div>
                </td>
                <td className="py-1 text-right align-top w-20">
                  {formatPercent(config.cpp2.rate)}
                </td>
                <td className="py-1 text-right font-medium align-top w-20">
                  {formatAmount(cpp2Amount)}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">
                  <div>{config.ei.shortName}</div>
                  <div className="text-xs text-muted-foreground/70">
                    <Trans>First</Trans> {formatAmount(config.ei.maxEarnings)}
                  </div>
                </td>
                <td className="py-1 text-right align-top w-20">
                  {formatPercent(config.ei.rate)}
                </td>
                <td className="py-1 text-right font-medium align-top w-20">
                  {formatAmount(eiAmount)}
                </td>
              </tr>
              <tr className="font-semibold border-t border-border">
                <td className="py-1" colSpan={2}>
                  <Trans>Total</Trans>
                </td>
                <td className="py-1 text-right w-20">
                  {formatAmount(payrollTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Overall Total */}
      <div className="mt-6 pt-4 border-t-2 border-border">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>
            <Trans>Total Federal Tax</Trans>
          </span>
          <span>{formatAmount(totalFederalTax)}</span>
        </div>
      </div>
    </div>
  );
}

// Provincial Tax Card - all provincial taxes in one card
interface ProvincialTaxCardProps {
  provinceName: string;
  config: TaxYearProvinceConfig["provincial"];
  income: number;
}

function ProvincialTaxCard({
  provinceName,
  config,
  income,
}: ProvincialTaxCardProps) {
  // Calculate provincial income tax for surtax calculation
  const breakdown = getBracketTaxBreakdown(income, config.incomeTax.brackets);
  const lowestRate = config.incomeTax.brackets[0]?.rate ?? 0;
  const bpaCredit = config.incomeTax.basicPersonalAmount * lowestRate;
  const provincialTaxBeforeCredit = breakdown.reduce(
    (sum, b) => sum + b.taxAmount,
    0,
  );
  const provincialTax = Math.max(0, provincialTaxBeforeCredit - bpaCredit);

  const surtaxAmount = config.surtax
    ? calculateSurtax(provincialTax, config.surtax)
    : 0;
  const healthPremiumAmount = config.healthPremium
    ? calculateHealthPremium(income, config.healthPremium)
    : 0;

  // Overall total
  const totalProvincialTax = provincialTax + surtaxAmount + healthPremiumAmount;

  return (
    <div className="bg-card rounded-lg shadow-sm border p-6 flex flex-col">
      <div className="flex-grow">
        <h3 className="font-bold text-lg mb-4">
          <Trans>{provinceName} Taxes</Trans>
        </h3>

        {/* Income Tax Brackets */}
        <IncomeTaxBracketsSection
          title={config.incomeTax.name}
          config={config.incomeTax}
          income={income}
        />

        {/* Surtax (if applicable) */}
        {config.surtax && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-semibold text-base mb-2">
              {config.surtax.name}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              <Trans>
                Applied to provincial tax of {formatAmount(provincialTax)}
              </Trans>
            </p>
            <table className="w-full text-left text-sm">
              <tbody>
                {config.surtax.tiers.map((tier, index) => {
                  const additionalRate =
                    tier.rate -
                    (index > 0 ? config.surtax!.tiers[index - 1].rate : 0);
                  const taxableAboveThreshold = Math.max(
                    0,
                    provincialTax - tier.threshold,
                  );
                  const tierAmount = taxableAboveThreshold * additionalRate;
                  return (
                    <tr
                      key={index}
                      className={tierAmount === 0 ? "opacity-40" : ""}
                    >
                      <td className="py-1 text-muted-foreground">
                        <Trans>Above {formatAmount(tier.threshold)}</Trans>
                      </td>
                      <td className="py-1 text-right w-20">
                        +{formatPercent(additionalRate)}
                      </td>
                      <td className="py-1 text-right font-medium w-20">
                        {formatAmount(tierAmount)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-semibold border-t border-border">
                  <td className="py-1" colSpan={2}>
                    <Trans>Total</Trans>
                  </td>
                  <td className="py-1 text-right w-20">
                    {formatAmount(surtaxAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Health Premium (if applicable) */}
        {config.healthPremium && (
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="font-semibold text-base mb-2">
              {config.healthPremium.name}
            </h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <Trans>Based on income of {formatAmount(income)}</Trans>
              </span>
              <span className="font-medium">
                {formatAmount(healthPremiumAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Overall Total */}
      <div className="mt-6 pt-4 border-t-2 border-border">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>
            <Trans>Total {provinceName} Tax</Trans>
          </span>
          <span>{formatAmount(totalProvincialTax)}</span>
        </div>
      </div>
    </div>
  );
}

interface TaxDetailsProps {
  config: TaxYearProvinceConfig;
  income: number;
  setIncome: (income: number) => void;
  province: string;
  setProvince: (province: string) => void;
  year: SupportedYear;
  setYear: (year: SupportedYear) => void;
}

function TaxDetails({
  config,
  income,
  setIncome,
  province,
  setProvince,
  year,
  setYear,
}: TaxDetailsProps) {
  const provinceName = PROVINCE_NAMES[config.province] || config.province;

  return (
    <div id="tax-details" className="mt-16 scroll-mt-8">
      <h2 className="text-2xl font-bold text-center mb-2">
        <Trans>
          Tax Details for {provinceName} ({config.year})
        </Trans>
      </h2>
      <p className="text-center text-foreground/60 mb-6">
        <Trans>All the taxes that apply to your income</Trans>
      </p>

      <div className="mb-8">
        <TaxCalculatorForm
          income={income}
          setIncome={setIncome}
          province={province}
          setProvince={setProvince}
          year={year}
          setYear={setYear}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FederalTaxCard
          config={config.federal}
          provincialConfig={config.provincial}
          income={income}
        />
        <ProvincialTaxCard
          provinceName={provinceName}
          config={config.provincial}
          income={income}
        />
      </div>
    </div>
  );
}

// Province shortcodes mapping (ISO 3166-2:CA codes)
const PROVINCE_CODES: Record<string, string> = {
  AB: "alberta",
  BC: "british-columbia",
  MB: "manitoba",
  NB: "new-brunswick",
  NL: "newfoundland-and-labrador",
  NS: "nova-scotia",
  NT: "northwest-territories",
  NU: "nunavut",
  ON: "ontario",
  PE: "prince-edward-island",
  QC: "quebec",
  SK: "saskatchewan",
  YT: "yukon",
};

const PROVINCE_TO_CODE: Record<string, string> = {
  alberta: "AB",
  "british-columbia": "BC",
  manitoba: "MB",
  "new-brunswick": "NB",
  "newfoundland-and-labrador": "NL",
  "nova-scotia": "NS",
  "northwest-territories": "NT",
  nunavut: "NU",
  ontario: "ON",
  "prince-edward-island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

const DEFAULT_INCOME = 100000;
const DEFAULT_PROVINCE = "ontario";
const DEFAULT_YEAR: SupportedYear = "2025";

export default function TaxCalculatorPage() {
  const { t, i18n } = useLingui();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL params or defaults
  const initialIncome = (() => {
    const incomeParam = searchParams.get("income");
    if (incomeParam) {
      const parsed = Number(incomeParam);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return DEFAULT_INCOME;
  })();

  const initialProvince = (() => {
    const provinceParam = searchParams.get("province")?.toUpperCase();
    if (provinceParam && PROVINCE_CODES[provinceParam]) {
      return PROVINCE_CODES[provinceParam];
    }
    return DEFAULT_PROVINCE;
  })();

  const initialYear = (() => {
    const yearParam = searchParams.get("year");
    const supportedYears = getSupportedYears();
    if (yearParam && supportedYears.includes(yearParam as SupportedYear)) {
      return yearParam as SupportedYear;
    }
    return DEFAULT_YEAR;
  })();

  const [income, setIncome] = useState<number>(initialIncome);
  const [province, setProvince] = useState<string>(initialProvince);
  const [year, setYear] = useState<SupportedYear>(initialYear);

  // Update URL when income, province, or year changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("province", PROVINCE_TO_CODE[province] || "ON");
    params.set("income", income.toString());
    params.set("year", year);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [income, province, year, router]);

  const taxConfig = useMemo(() => {
    return getTaxConfig(year, province);
  }, [year, province]);

  const detailedCalculation = useMemo(() => {
    if (income <= 0) return null;
    return calculateDetailedTax(income, province, year);
  }, [income, province, year]);

  const breakdown = useMemo(() => {
    if (!detailedCalculation) return null;
    return calculatePersonalTaxBreakdown(detailedCalculation, province, year);
  }, [detailedCalculation, province, year]);

  return (
    <PageContent>
      <Section>
        <div className="text-center mb-8">
          <H1>{t`Where Your Tax Dollars Go`}</H1>
          <p className="text-lg text-foreground/60 mt-4 max-w-3xl mx-auto">
            {t`Enter your income to see a personalized breakdown of how much you contribute to different government services and programs.`}
          </p>
        </div>

        <TaxCalculatorForm
          income={income}
          setIncome={setIncome}
          province={province}
          setProvince={setProvince}
          year={year}
          setYear={setYear}
        />

        {detailedCalculation && (
          <>
            <div className="mt-8">
              <TaxSummary taxCalculation={detailedCalculation} />
            </div>

            <div className="mt-6 text-center">
              <a
                href="#tax-details"
                className="inline-flex items-center gap-2 text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("tax-details")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Trans>View detailed tax breakdown</Trans>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {breakdown ? (
              <>
                <div className="mt-12">
                  <CombinedSpendingChart
                    data={breakdown.combinedChartData}
                    title={t`Where Your Tax Dollars Go`}
                    totalAmount={breakdown.taxCalculation.totalTax}
                  />
                </div>

                <div className="mt-12 bg-card p-6 rounded-lg">
                  <H2>{t`Understanding Your Tax Contribution`}</H2>
                  <div className="mt-4 space-y-3 text-sm text-foreground/60">
                    <p>
                      {t`This visualization shows how your income tax contributions are allocated across different government programs and services based on current government spending patterns. Amounts under $20 are grouped into "Other" for conciseness.`}
                    </p>
                    <p>
                      {t`Your tax contributions are approximated based on employment income. Deductions such as basic personal amount are estimated and included. Other sources of income, such as self-employment, investment income, and capital gains, are not included in the calculations. Deductions such as RRSP and FHSA contributions are also not included.`}{" "}
                      <Trans>
                        Tax calculations are based on {year} federal and
                        provincial tax brackets.
                      </Trans>
                    </p>
                    <p>
                      {t`Government spending is based on 2023-2024 fiscal spending. Attempts have been made to merge similar categories across federal and provincial spending.`}
                    </p>
                    <p>
                      <Trans>
                        For further breakdowns of spending, see{" "}
                        <a
                          href={localizedPath("/federal/spending", i18n.locale)}
                          className="underline"
                        >
                          Federal
                        </a>{" "}
                        and{" "}
                        <a
                          href={localizedPath(
                            province === "alberta" ? "/alberta" : "/ontario",
                            i18n.locale,
                          )}
                          className="underline"
                        >
                          Provincial
                        </a>{" "}
                        spending pages.
                      </Trans>
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-12 bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      <Trans>Spending Breakdown Coming Soon</Trans>
                    </h3>
                    <p className="text-foreground/60">
                      <Trans>
                        Spending data is not yet available for this province and
                        year combination. The income tax calculation above is
                        still accurate based on {year} tax rates.
                      </Trans>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Section>

      {taxConfig && (
        <TaxDetails
          config={taxConfig}
          income={income}
          setIncome={setIncome}
          province={province}
          setProvince={setProvince}
          year={year}
          setYear={setYear}
        />
      )}

      {detailedCalculation && (
        <Section>
          <JurisdictionComparisonChart
            income={income}
            year={year}
            selectedProvince={province}
          />
        </Section>
      )}

      <Section>
        <hr></hr>
        <p className="mt-6 text-center text-sm text-foreground/60">
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/ruchishshah/"
            target="_blank"
            className="underline"
          >
            Ru
          </a>
        </p>
      </Section>
    </PageContent>
  );
}
