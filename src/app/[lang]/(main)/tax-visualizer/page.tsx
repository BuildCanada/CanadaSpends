"use client";

import { useState, useMemo } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { H1, H2, PageContent, Section } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { CombinedSpendingChart } from "@/components/CombinedSpendingChart";
import { calculateTotalTax, formatCurrency } from "@/lib/taxCalculator";
import { calculatePersonalTaxBreakdown } from "@/lib/personalTaxBreakdown";
import { localizedPath } from "@/lib/utils";

type ProvinceData = {
  name: string;
  bpa: string;
  brackets: Array<{ range: string; rate: string }>;
};

const PROVINCE_DATA: Record<string, ProvinceData> = {
  alberta: {
    name: "Alberta",
    bpa: "$21,885",
    brackets: [
      { range: "First $148,269", rate: "10%" },
      { range: "$148,269 - $177,922", rate: "12%" },
      { range: "$177,922 - $237,230", rate: "13%" },
      { range: "$237,230 - $355,845", rate: "14%" },
      { range: "More than $355,845", rate: "15%" },
    ],
  },
  ontario: {
    name: "Ontario",
    bpa: "$12,399",
    brackets: [
      { range: "First $51,446", rate: "5.05%" },
      { range: "$51,446 - $102,894", rate: "9.15%" },
      { range: "$102,894 - $150,000", rate: "11.16%" },
      { range: "$150,000 - $220,000", rate: "12.16%" },
      { range: "More than $220,000", rate: "13.16%" },
    ],
  },
};

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
            <option value="alberta">{t`Alberta`}</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            {t`More provinces coming soon.`}
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

interface TaxBracketsTableProps {
  province: string;
}

function TaxBracketsTable({ province }: TaxBracketsTableProps) {
  const data = PROVINCE_DATA[province];
  if (!data) return null;

  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-center mb-2">
        {data.name} Provincial and Federal tax brackets
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
        {/* Provincial Tax Brackets */}
        <div className="bg-white rounded-lg shadow-sm border p-6 flex-1 min-w-[320px] max-w-md">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pb-2 font-bold">{data.name} tax bracket</th>
                <th className="pb-2 font-bold text-right">
                  {data.name} tax rate
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-base">
              {data.brackets.map((bracket, index) => (
                <tr key={index}>
                  <td className="py-2">{bracket.range}</td>
                  <td className="py-2 text-right">{bracket.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-center text-xs text-gray-600 mt-8">
        Basic personal amount of $15,705 for federal and {data.bpa} for{" "}
        {data.name} have been deducted.
      </p>
    </div>
  );
}

// Remove the old SpendingVisualization component since we're using the combined chart

export default function TaxCalculatorPage() {
  const { t, i18n } = useLingui();
  const [income, setIncome] = useState<number>(100000);
  const [province, setProvince] = useState<string>("ontario");

  const taxCalculation = useMemo(() => {
    if (income <= 0) return null;
    return calculateTotalTax(income, province);
  }, [income, province]);

  const breakdown = useMemo(() => {
    if (!taxCalculation) return null;
    return calculatePersonalTaxBreakdown(taxCalculation, province);
  }, [taxCalculation, province]);

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

            <div className="mt-12 bg-blue-50 p-6 rounded-lg">
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
        )}
      </Section>
      <TaxBracketsTable province={province} />
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
