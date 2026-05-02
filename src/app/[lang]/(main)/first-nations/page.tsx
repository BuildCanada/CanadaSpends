import { Trans, useLingui } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { H1, Intro, Page, PageContent, Section } from "@/components/Layout";
import {
  FirstNationsFAQ,
  FirstNationsSearch,
} from "@/components/first-nations";
import { getAllFirstNations } from "@/lib/supabase";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { Metadata } from "next";

export const revalidate = 3600; // Revalidate every hour
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
    title: t`First Nations Financial Data | Canada Spends`,
    description: t`Explore financial data from First Nations across Canada. View statements of operations, financial positions, and remuneration from annual reports published under the First Nations Financial Transparency Act (FNFTA).`,
    alternates: generateHreflangAlternates(lang, "/first-nations"),
    openGraph: {
      title: t`First Nations Financial Data | Canada Spends`,
      description: t`Explore financial data from First Nations across Canada under the First Nations Financial Transparency Act.`,
      type: "website",
    },
  };
}

export default async function FirstNationsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  initLingui(lang);

  const firstNations = await getAllFirstNations();

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>First Nations Financial Data</Trans>
          </H1>
          <Intro>
            <Trans>
              Explore financial data from First Nations across Canada. Data is
              extracted from annual reports published under the First Nations
              Financial Transparency Act (FNFTA), including statements of
              operations, financial position, and remuneration.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <FirstNationsFAQ />
        </Section>
        <Section>
          <FirstNationsSearch firstNations={firstNations} lang={lang} />
        </Section>
      </PageContent>
    </Page>
  );
}
