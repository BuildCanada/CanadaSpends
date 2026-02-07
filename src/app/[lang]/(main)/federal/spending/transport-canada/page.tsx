import { DepartmentList } from "@/components/DepartmentList";
import { DepartmentSpendingChart } from "@/components/DepartmentSpendingChart";
import {
  ChartContainer,
  H1,
  H2,
  H3,
  Intro,
  P,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import NoSSR from "@/components/NoSSR";
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { useFindDepartment } from "@/hooks/useDepartments";
import { initLingui, type PageLangParam } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import type { PropsWithChildren } from "react";
import { FederalSpendingByEntity } from "./FederalSpendingByEntity";
import { MiniSankey } from "./MiniSankey";
import UpdatedAt from "../_common/updatedAt";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  return {
    title: t`Transport Canada | Canada Spends`,
    description: t`A look at how Transport Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("transport-canada");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              The Department of Transport (Transport Canada) is the federal
              department responsible for developing and enforcing transportation
              policies, regulations, and infrastructure projects to ensure safe
              and efficient movement of people and goods across Canada. It
              oversees aviation, rail, marine, and road transportation systems,
              working to enhance national connectivity and economic growth.
            </Trans>
          </Intro>
        </Section>

        <Section>
          <UpdatedAt>
            <Trans>Data updated March 21, 2025</Trans>
          </UpdatedAt>
          <StatCardContainer>
            <StatCard
              title={t`In FY 2024,`}
              value="$5.1B"
              subtitle={t`Was spent by the Dept. of Transport`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="1%"
              subtitle={t`Of federal spending was by the Dept. of Transport`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Transport Canada spent $5.1 billion in fiscal year (FY) 2024. This
              was 1% of the $513.9 billion in overall federal spending. The
              department ranked fourteenth among federal departments in total
              spending.
            </Trans>
          </P>

          <H3>
            <Trans>
              Transport Canada accounted for 1% of all federal spending in FY
              2024. 10 government departments accounted for 73.2% of federal
              spending in FY 2024
            </Trans>
          </H3>
          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Federal spending may shift over time due to population growth,
              changes in policy and programs, and emerging problems to address.
              Since 1995, overall federal spending has risen 74.9%, while
              Transport spending has remained relatively flat.
            </Trans>
          </P>
          <P>
            <Trans>
              In FY 2024, Transport Canada accounted for 1% of all federal
              spending, 0.74% percentage points lower than in 1995.
            </Trans>
          </P>
          <P>
            <Trans>
              Major legislation, internal or global economic conditions, and
              acute events like the COVID-19 pandemic can significantly
              influence government spending year to year. For instance, during
              the pandemic, the Government of Canada's total expenses rose from
              $410.2 billion in 2019 to $420 billion in 2020 and further to
              $720.3 billion in 2021.
            </Trans>
          </P>
          <P>
            <Trans>
              Similarly, Transport Canada's expenditures experienced
              fluctuations during this period, increasing from approximately
              $3.2 billion​ in 2019 (adjusted for inflation) to $5.1B in 2024.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>How did Transport Canada spend its budget in FY24?</Trans>
          </H2>
          <P>
            <Trans>Federal government spending isolated to FY 2024</Trans>
          </P>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Federal departments often contain other entities including
              offices, crown corporations and agencies. In FY 2024, Transport
              Canada reported total expenditures of $5.1 billion across the
              following entities:
            </Trans>
          </P>
          <ChartContainer>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who Leads Transport Canada?</Trans>
          </H2>
          <P>
            <Trans>
              Transport Canada is led by the Minister of Transport, who is
              appointed by the Governor General on the advice of the Prime
              Minister and formally sworn into office at Rideau Hall. Upon
              appointment, the Minister takes the Oath of Office and the Oath of
              Allegiance, becoming a member of the King's Privy Council for
              Canada.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister of Transport is one of the cabinet members who serve
              at the Prime Minister's discretion. Their tenure typically ends
              when they resign, are replaced, or when a new Prime Minister
              appoints a new cabinet. Outgoing ministers continue in their roles
              until their successors are sworn in.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister is responsible for overseeing Canada's transportation
              policies, ensuring safety regulations, investing in
              infrastructure, and leading climate initiatives related to
              aviation, rail, marine, and road transportation.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Explore other Federal Departments</Trans>
          </H2>
          <DepartmentList current={department.slug} />
        </Section>
      </PageContent>
    </Page>
  );
}
