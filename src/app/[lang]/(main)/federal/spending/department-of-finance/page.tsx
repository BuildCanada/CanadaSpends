import { DepartmentList } from "@/components/DepartmentList";
import { DepartmentSpendingChart } from "@/components/DepartmentSpendingChart";
import {
  ChartContainer,
  ExternalLink,
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
    title: t`Department of Finance | Canada Spends`,
    description: t`A look at how the Department of Finance spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("department-of-finance");

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department?.name}</H1>
          <Intro>
            <Trans>
              The Department of Finance (Finance Canada) is a central federal
              department responsible for overseeing the nation's economic and
              fiscal policies, ensuring financial stability, and managing the
              government's fiscal framework. Established in 1867 as one of the
              original departments following Confederation, it advises the Prime
              Minister and Cabinet on economic matters, develops tax and tariff
              policies, and prepares the annual federal budget.
            </Trans>
          </Intro>
        </Section>

        <Section>
          <UpdatedAt>
            <Trans>Data updated March 20, 2025</Trans>
          </UpdatedAt>
          <StatCardContainer>
            <StatCard
              title={t`In FY 2024,`}
              value="$136.1B"
              subtitle={t`was spent by Finance Canada`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="26.4%"
              subtitle={t`of federal spending was by Finance Canada`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              The Department of Finance spent $136.1 billion in fiscal year (FY)
              2024. This was 26.4% of the $513.9 billion in overall federal
              spending. The department ranked first among federal departments in
              total spending.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              The Department of Finance accounted for 26.4% of all federal
              spending in FY 2024.
            </Trans>
          </H2>
          <H3>
            <Trans>
              10 government departments accounted for 73.2% of federal spending
              in FY 2024
            </Trans>
          </H3>
          <ChartContainer>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
          <P>
            <Trans>
              Federal spending may shift over time due to population growth,
              changes in policy and programs, and emerging problems to address.
              Since 1995, overall federal spending has risen 74.9%, while
              Department of Finance spending has increased 41.4%.
            </Trans>
          </P>
          <P>
            <Trans>
              Major legislation, internal or global economic conditions, and
              acute events like the COVID-19 pandemic can affect spending year
              to year. For example, the federal expenses fluctuated during the
              pandemic, rising from $410.2 billion (in 2024 dollars) in 2019 to
              $420 billion in 2020 and $720.3 billion in 2021
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              The Department of Finance's share of federal spending in FY 2024
              was lower than FY 1995.
            </Trans>
          </H2>
          <H3>
            <Trans>
              Percentage of federal budget dedicated to Finance, FYs 1995-2024
            </Trans>
          </H3>
          <ChartContainer>
            <FederalSpendingChart />
          </ChartContainer>
          <P>
            <Trans>
              Most federal spending can be categorized as direct or indirect.
              Direct spending refers to money the federal government spends on
              budget items such as federal programs, employee salaries, and debt
              interest. Indirect spending refers to federal transfers to other
              levels of government.
            </Trans>
          </P>
          <P>
            <Trans>
              In FY 2024, Finance Canada transferred 66.2% of its total spending
              to provinces and territories. The chart below outlines all
              departmental spending in 2024.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              How did the Department of Finance spend its budget in 2024?
            </Trans>
          </H2>
          <H3>
            <Trans>Federal government spending in FY 2024</Trans>
          </H3>
          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
          <P>
            <Trans>
              Federal departments often contain other entities including
              offices, crown corporations and agencies. In FY 2024, Department
              of Finance entities with the highest expenditures were the Office
              of the Superintendent of Financial Institutions, Office of the
              Auditor General, and the Financial Transactions and Reports
              Analysis Centre of Canada.
            </Trans>
          </P>
          <H3>
            <Trans>
              Department of Finance, Spending by Entity, FY 2024 (in millions)
            </Trans>
          </H3>
          <ChartContainer>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads the Department of Finance?</Trans>
          </H2>
          <P>
            <Trans>
              The Department is led by the{" "}
              <ExternalLink href="https://www.canada.ca/en/government/ministers/dominic-leblanc.html">
                Minister of Finance
              </ExternalLink>
              , who is appointed by the Governor General on the advice of the
              Prime Minister and then formally sworn into office at Rideau Hall.
              They take the Oath of Office and the Oath of Allegiance and become
              a member of the King's Privy Council for Canada.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister of Finance is one of the{" "}
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
