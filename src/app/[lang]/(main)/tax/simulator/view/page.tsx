import type { Metadata } from "next";
import { useLingui } from "@lingui/react/macro";

import { buildScenarioMetadata } from "@/components/tax-simulator/metadata";
import { TaxPlanView } from "@/components/tax-simulator/TaxPlanView";
import { initLingui } from "@/initLingui";
import { parseScenario } from "@/lib/tax";

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
    path: "/tax/simulator/view",
    fallbackTitle: t`Tax Simulator`,
    fallbackDescription: t`See how different tax rules would change taxes for Canadians at every income.`,
  });
}

// Shared, read-only view of a comparison. Rendered on the server from the
// query string so link previews and first paint show the real numbers.
export default async function TaxPlanViewPage({ searchParams }: Props) {
  const scenario = parseScenario(await searchParams);
  return <TaxPlanView scenario={scenario} />;
}
