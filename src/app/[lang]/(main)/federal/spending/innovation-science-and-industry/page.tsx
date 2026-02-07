import { DepartmentList } from "@/components/DepartmentList";
import { DepartmentSpendingChart } from "@/components/DepartmentSpendingChart";
import {
  ChartContainer,
  H1,
  H2,
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
    title: t`Innovation, Science and Industry Canada | Canada Spends`,
    description: t`A look at how Innovation, Science and Industry Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("innovation-science-and-industry");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              The Department of Innovation, Science and Industry (ISED) is the
              federal department responsible for fostering economic growth,
              technological advancement, and scientific research in Canada. It
              plays a key role in supporting businesses, funding research and
              development, and shaping policies that aim to enhance innovation,
              industrial competitiveness, and the prosperity of the Canadian
              economy.
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
              value="$10.2B"
              subtitle={t`Was spent by the Dept. of Innovation, Science and Industry`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="2%"
              subtitle={t`Of federal spending was by the Dept. of Innovation, Science and Industry`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              ISED spent $10.2 billion in fiscal year (FY) 2024. This was 2% of
              the $513.9 billion in overall federal spending. The department
              ranked eleventh among federal departments in total spending.
            </Trans>
          </P>

          <P>
            <Trans>
              While not in the top 10 departments by spend, ISED accounted for
              2% of all federal spending in FY 2024. 10 government departments
              accounted for 73.2% of federal spending in FY 2024
            </Trans>
          </P>
          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Federal spending may shift over time due to population growth,
              changes in policy and programs, and emerging problems to address.
              Since 1995, overall federal spending has risen 74.9%, while ISED
              spending has increased 90.3%.
            </Trans>
          </P>
          <P>
            <Trans>
              The department's spending has grown more than overall spending,
              which means that the department's share of the federal budget has
              increased. In FY 2024, ISED accounted for 2% of all federal
              spending, 0.17 percentage points higher than in 1995.
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
              Similarly, ISED's expenditures have increased during this period,
              growing from approximately $6.5 billion​ in 2019 (adjusted for
              inflation) to $10.2 billion in 2024.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>How did ISED spend its budget in FY 24?</Trans>
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
              offices, crown corporations and agencies. In FY 2024, ISED's
              budget was split across the following entities:
            </Trans>
          </P>
          <ChartContainer>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>
              Who Leads Innovation, Science and Industry Canada (ISED)?
            </Trans>
          </H2>
          <P>
            <Trans>
              Innovation, Science and Industry Canada (ISED) is led by the
              Minister of Innovation, Science and Industry, who is appointed by
              the Governor General on the advice of the Prime Minister and
              formally sworn into office at Rideau Hall. Upon appointment, the
              Minister takes the Oath of Office and the Oath of Allegiance,
              becoming a member of the King's Privy Council for Canada.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister of Innovation, Science and Industry is one of the
              cabinet members who serve at the Prime Minister's discretion.
              Their tenure typically ends when they resign, are replaced, or
              when a new Prime Minister appoints a new cabinet. Outgoing
              ministers continue in their roles until their successors are sworn
              in.
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
