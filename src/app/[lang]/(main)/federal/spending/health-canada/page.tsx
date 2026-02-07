import { DepartmentList } from "@/components/DepartmentList";
import { DepartmentSpendingChart } from "@/components/DepartmentSpendingChart";
import {
  ChartContainer,
  ExternalLink,
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
import { FederalSpendingChart } from "./FederalSpendingChart";
import { MiniSankey } from "./MiniSankey";
import UpdatedAt from "../_common/updatedAt";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  return {
    title: t`Health Canada | Canada Spends`,
    description: t`A look at how Health Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("health-canada");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              Health Canada is the federal department responsible for protecting
              and improving the health of Canadians. It develops health
              policies, regulates pharmaceuticals and medical devices, enforces
              food safety standards, and funds public health programs. The
              department works with provinces and territories to support the
              healthcare system while ensuring safety standards for drugs,
              consumer products, and nutrition guidelines.
            </Trans>
          </Intro>
          <Intro>
            <Trans>
              Through the Public Health Agency of Canada (PHAC), Health Canada
              monitors public health risks, manages disease outbreaks, and
              promotes health initiatives. It also funds medical research via
              the Canadian Institutes of Health Research (CIHR) and oversees
              healthcare services for Indigenous communities.
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
              value="$13.7B"
              subtitle={t`was spent by Health Canada`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="2.7%"
              subtitle={t`of federal spending was by Health Canada`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Health Canada spent $13.7 billion in fiscal year (FY) 2024. This
              was 2.7% of the $513.9 billion in overall federal spending. The
              department ranked tenth among federal departments in total
              spending.
            </Trans>
          </P>

          <P>
            <Trans>
              Health Canada accounted for 2.7% of all federal spending in FY
              2024. 10 government departments accounted for 73.2% of federal
              spending in FY 2024
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
              changes in policy and programs, and emerging challenges. Since FY
              1995, overall federal spending has risen 74.9%, while Health
              Canada spending has decreased 19.9% when adjusted for inflation.
            </Trans>
          </P>
          <P>
            <Trans>
              The department's spending grew at a rate significantly lower than
              overall spending, reflecting shifts in federal priorities. In FY
              2024, Health Canada accounted for 2.7% of all federal spending,
              3.14 percentage points lower than in 1995.
            </Trans>
          </P>
          <P>
            <Trans>
              Major legislation, internal or global economic conditions, and
              acute events like the COVID-19 pandemic can significantly
              influence government spending year to year. For example, during
              the COVID-19 pandemic, federal support programs led to a temporary
              surge in spending. Health Canada expenditures increased from $5
              billion in FY 2019 to $14.2 billion in FY 2021 before stabilizing
              in recent years.
            </Trans>
          </P>

          <ChartContainer>
            <FederalSpendingChart />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans> How did Health Canada spend its budget in FY24?</Trans>
          </H2>
          <P>
            <Trans>
              Federal departments often contain other entities including
              offices, crown corporations and agencies. The Health Canada
              entities with the biggest expenditures in FY 2024 were
            </Trans>
          </P>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads Health Canada?</Trans>
          </H2>
          <P>
            <Trans>
              Health Canada is led by the{" "}
              <ExternalLink href="https://www.pm.gc.ca/en/cabinet/honourable-kamal-khera">
                Minister of Health
              </ExternalLink>
              , who is appointed by the Governor General on the advice of the
              Prime Minister and formally sworn into office at Rideau Hall. Upon
              appointment, the Minister takes the Oath of Office and the Oath of
              Allegiance, becoming a member of the King's Privy Council for
              Canada.
            </Trans>
          </P>
          <P>
            <Trans>
              These Ministers are some of the{" "}
              <ExternalLink href="https://www.pm.gc.ca/en/cabinet">
                cabinet members
              </ExternalLink>{" "}
              who serve at the Prime Minister's discretion. Their tenure
              typically ends when they resign, are replaced, or when a new Prime
              Minister takes office and appoints a new cabinet. Outgoing
              ministers remain in their roles until their successors are sworn
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
