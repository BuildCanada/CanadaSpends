import type { Metadata } from "next";
import { Trans, useLingui } from "@lingui/react/macro";
import { H1, Intro, Page, PageContent, Section } from "@/components/Layout";
import { MunicipalFinancialStatementsSearch } from "@/components/municipal/MunicipalFinancialStatementsSearch";
import { initLingui } from "@/initLingui";
import { getMunicipalFinancialStatements } from "@/lib/municipal-financial-statements";
import { generateHreflangAlternates } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  initLingui(lang);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();
  return {
    title: t`Municipal Financial Statements | Canada Spends`,
    description: t`Explore reviewed financial statement data for municipalities across Canada.`,
    alternates: generateHreflangAlternates(lang, "/municipal"),
  };
}

export default async function MunicipalFinancialStatementsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  initLingui(lang);
  const municipalities = await getMunicipalFinancialStatements();

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>Municipal Financial Statements</Trans>
          </H1>
          <Intro>
            <Trans>
              Explore revenue, expenses, assets, liabilities, and accumulated
              surplus reported by municipalities across Canada.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <MunicipalFinancialStatementsSearch
            municipalities={municipalities}
            lang={lang}
          />
        </Section>
      </PageContent>
    </Page>
  );
}
