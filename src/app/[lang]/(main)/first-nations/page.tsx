import { Trans } from "@lingui/react/macro";
import { initLingui } from "@/initLingui";
import { H1, Intro, Page, PageContent, Section } from "@/components/Layout";
import { BandSearch } from "@/components/first-nations";
import { getAllBands } from "@/lib/supabase";
import { locales } from "@/lib/constants";

export const revalidate = 3600; // Revalidate every hour
export const dynamicParams = true;

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function FirstNationsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  initLingui(lang);

  const bands = await getAllBands();

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>First Nations Financial Data</Trans>
          </H1>
          <Intro>
            <Trans>
              Explore financial data from First Nations bands across Canada.
              Data is extracted from annual reports published under the First
              Nations Financial Transparency Act (FNFTA), including statements
              of operations, financial position, and remuneration.
            </Trans>
          </Intro>
        </Section>
        <Section>
          <BandSearch bands={bands} lang={lang} />
        </Section>
      </PageContent>
    </Page>
  );
}
