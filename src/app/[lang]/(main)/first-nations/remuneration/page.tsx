import { Trans, useLingui } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { H1, Intro, Page, PageContent, Section } from "@/components/Layout";
import { RemunerationOverview } from "@/components/first-nations";
import { getBandRemunerationSummary } from "@/lib/supabase";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { Metadata } from "next";

export const revalidate = 3600;
export const dynamicParams = true;
// Render at request time to avoid build failure when api.buildcanada.com is unreachable
export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

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
    title: t`First Nations Remuneration Overview | Canada Spends`,
    description: t`Compare remuneration data across First Nations. View total compensation, per-capita spending, and individual official entries from annual reports.`,
    alternates: generateHreflangAlternates(lang, "/first-nations/remuneration"),
    openGraph: {
      title: t`First Nations Remuneration Overview | Canada Spends`,
      description: t`Compare remuneration data across First Nations from annual reports published under the FNFTA.`,
      type: "website",
    },
  };
}

export default async function RemunerationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  initLingui(lang);

  const summaries = await getBandRemunerationSummary();

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>First Nations Remuneration Overview</Trans>
          </H1>
          <Intro>
            <Trans>
              Compare remuneration data across First Nations. Data is extracted
              from remuneration schedules published under the First Nations
              Financial Transparency Act (FNFTA). Click any row to see
              individual official entries.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <RemunerationOverview summaries={summaries} lang={lang} />
        </Section>
      </PageContent>
    </Page>
  );
}
