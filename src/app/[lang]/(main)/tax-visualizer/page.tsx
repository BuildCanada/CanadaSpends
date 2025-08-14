"use client";

import { useState, useMemo } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { H1, H2, PageContent, Section } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { CombinedSpendingChart } from "@/components/CombinedSpendingChart";
import { calculateTotalTax, formatCurrency } from "@/lib/taxCalculator";
import { calculatePersonalTaxBreakdown } from "@/lib/personalTaxBreakdown";
import { TaxContributionShareButton } from "@/components/TaxContributionShareButton";
import { viralShares } from "@/lib/viralShares";

interface TaxCalculatorFormProps {
  income: number;
  setIncome: (income: number) => void;
  province: string;
  setProvince: (province: string) => void;
}

function TaxCalculatorForm({
  income,
  setIncome,
  province,
  setProvince,
}: TaxCalculatorFormProps) {
  const { t } = useLingui();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <H2>{t`Calculate Your Tax Contribution`}</H2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
            placeholder="100,000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="province"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t`Province/Territory`}
          </label>
          <select
            id="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ontario">{t`Ontario`}</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {t`Currently supports Ontario only. More provinces coming soon.`}
          </p>
        </div>
      </div>
    </div>
  );
}

interface TaxSummaryProps {
  taxCalculation: ReturnType<typeof calculateTotalTax>;
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

function TaxBracketsTable() {
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-2">
        Ontario Provincial and Federal tax brackets
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Your taxable income is taxed at the following rates.
      </p>
      <div className="flex flex-col md:flex-row gap-8 justify-center">
        {/* Federal Tax Brackets */}
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-1 min-w-[320px] max-w-md">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 font-bold">Federal tax bracket</th>
                <th className="pb-2 font-bold text-right">Federal tax rate</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-base">
              <tr>
                <td className="py-2">First $55,867</td>
                <td className="py-2 text-right">15%</td>
              </tr>
              <tr>
                <td className="py-2">$55,867 - $111,733</td>
                <td className="py-2 text-right">20.5%</td>
              </tr>
              <tr>
                <td className="py-2">$111,733 - $173,205</td>
                <td className="py-2 text-right">26%</td>
              </tr>
              <tr>
                <td className="py-2">$173,205 - $246,752</td>
                <td className="py-2 text-right">29%</td>
              </tr>
              <tr>
                <td className="py-2">More than $246,752</td>
                <td className="py-2 text-right">33%</td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Ontario Tax Brackets */}
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-1 min-w-[320px] max-w-md">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 font-bold">Ontario tax bracket</th>
                <th className="pb-2 font-bold text-right">Ontario tax rate</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-base">
              <tr>
                <td className="py-2">First $51,446</td>
                <td className="py-2 text-right">5.05%</td>
              </tr>
              <tr>
                <td className="py-2">$51,446 - $102,894</td>
                <td className="py-2 text-right">9.15%</td>
              </tr>
              <tr>
                <td className="py-2">$102,894 - $150,000</td>
                <td className="py-2 text-right">11.16%</td>
              </tr>
              <tr>
                <td className="py-2">$150,000 - $220,000</td>
                <td className="py-2 text-right">12.16%</td>
              </tr>
              <tr>
                <td className="py-2">More than $220,000</td>
                <td className="py-2 text-right">13.16%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-xs text-gray-600 mt-8">
        Basic personal amount of $15,705 for federal and $12,399 for Ontario
        have been deducted.
      </p>
    </div>
  );
}

// Remove the old SpendingVisualization component since we're using the combined chart

export default function TaxCalculatorPage({
  params,
}: {
  params: { lang: string };
}) {
  const { t } = useLingui();
  const [income, setIncome] = useState<number>(100000);
  const [province, setProvince] = useState<string>("ontario");
  const [currentShareIndex, setCurrentShareIndex] = useState<number>(0);

  const taxCalculation = useMemo(() => {
    if (income <= 0) return null;
    return calculateTotalTax(income, province);
  }, [income, province]);

  const breakdown = useMemo(() => {
    if (!taxCalculation) return null;
    return calculatePersonalTaxBreakdown(taxCalculation);
  }, [taxCalculation]);

  const currentShareItem = useMemo(() => {
    if (!breakdown) return null;
    return {
      item: viralShares[currentShareIndex].item,
      amount:
        viralShares[currentShareIndex].amount /
        breakdown.taxCalculation.totalTax,
    };
  }, [breakdown, currentShareIndex]);

  const handlePreviousItem = () => {
    setCurrentShareIndex((prev) =>
      prev === 0 ? viralShares.length - 1 : prev - 1,
    );
  };

  const handleNextItem = () => {
    setCurrentShareIndex((prev) =>
      prev === viralShares.length - 1 ? 0 : prev + 1,
    );
  };

  return (
    <PageContent>
      <Section>
        <div className="text-center mb-8">
          <H1>{t`Where Your Tax Dollars Go`}</H1>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
            {t`Enter your income to see a personalized breakdown of how much you contribute to different government services and programs.`}
          </p>
        </div>

        <TaxCalculatorForm
          income={income}
          setIncome={setIncome}
          province={province}
          setProvince={setProvince}
        />

        {taxCalculation && breakdown && (
          <>
            <div className="mt-8">
              <TaxSummary taxCalculation={taxCalculation} />
            </div>

            <div className="mt-12">
              <CombinedSpendingChart
                data={breakdown.combinedChartData}
                title={t`Where Your Tax Dollars Go`}
                totalAmount={breakdown.taxCalculation.totalTax}
              />
            </div>

            <div className="mt-12 bg-blue-50 p-6 rounded-lg text-center">
              <H2>{t`Share Your Contribution`}</H2>
              <p className="text-md text-gray-700 mt-2 mb-6">
                {t`You're making a real difference! Share it on social to inspire others.`}
              </p>
              <div className="mt-4 flex flex-col items-center space-y-4">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={handlePreviousItem}
                    className="p-3 rounded-full bg-white hover:bg-gray-50 transition-colors duration-200 text-gray-700 shadow-sm border"
                    aria-label="Previous contribution"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex-shrink-0">
                    <TaxContributionShareButton
                      contributionIndex={currentShareIndex}
                      amount={currentShareItem?.amount || 0}
                      item={currentShareItem?.item || ""}
                      lang={params.lang}
                    />
                  </div>
                  <button
                    onClick={handleNextItem}
                    className="p-3 rounded-full bg-white hover:bg-gray-50 transition-colors duration-200 text-gray-700 shadow-sm border"
                    aria-label="Next contribution"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="flex justify-center space-x-2 mt-4">
                  {viralShares.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentShareIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        index === currentShareIndex
                          ? "bg-blue-500"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Go to contribution ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="text-sm text-gray-700 text-center">
                  {t`Thank you for your contribution to building a better Canada.`}
                </p>
              </div>
            </div>

            <div className="mt-12 bg-gray-50 p-6 rounded-lg">
              <H2>{t`Understanding Your Tax Contribution`}</H2>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <p>
                  {t`This visualization shows how your income tax contributions are allocated across different government programs and services based on current government spending patterns. Amounts under $20 are grouped into "Other" for conciseness.`}
                </p>
                <p>
                  {t`Your tax contributions are approximated based on employment income. Deductions such as basic personal amount are estimated and included. Other sources of income, such as self-employment, investment income, and capital gains, are not included in the calculations. Deductions such as RRSP and FHSA contributions are also not included. Tax calculations are based on 2024 federal and provincial tax brackets.`}
                </p>
                <p>
                  {t`Government spending is based on 2023-2024 fiscal spending. Attempts have been made to merge similar categories across federal and provincial spending.`}
                </p>
                <p>
                  <Trans>
                    For further breakdowns of spending, see{" "}
                    <a href="/spending" className="underline">
                      Federal
                    </a>{" "}
                    and{" "}
                    <a href="/ontario" className="underline">
                      Provincial
                    </a>{" "}
                    spending pages.
                  </Trans>
                </p>
              </div>
            </div>
          </>
        )}
      </Section>
      <TaxBracketsTable />
      <Section>
        <hr></hr>
        <p className="mt-6 text-center text-sm text-gray-600">
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
