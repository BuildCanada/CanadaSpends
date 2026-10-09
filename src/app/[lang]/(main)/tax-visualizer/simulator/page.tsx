import { Suspense } from "react";
import type { Metadata } from "next";
import { useLingui } from "@lingui/react/macro";

import { buildScenarioMetadata } from "@/components/tax-simulator/metadata";
import { TaxSimulator } from "@/components/tax-simulator/TaxSimulator";
import { initLingui } from "@/initLingui";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const lang = (await params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();

  return buildScenarioMetadata({
    lang,
    searchParams: await searchParams,
    path: "/tax-visualizer/simulator",
    fallbackTitle: t`Tax Simulator`,
    fallbackDescription: t`Rewrite Canada's tax brackets and compare your plan with current law, another province, or another plan.`,
  });
}

export default function TaxSimulatorPage() {
  return (
    <Suspense>
      <TaxSimulator />
    </Suspense>
  );
}
