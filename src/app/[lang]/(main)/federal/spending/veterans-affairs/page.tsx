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
    title: t`Veterans Affairs Canada | Canada Spends`,
    description: t`A look at how Veterans Affairs Canada spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("veterans-affairs");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              The Department of Veterans Affairs Canada (VAC) is the federal
              department responsible for supporting and serving Canadian
              veterans, active-duty military personnel, and their families. It
              provides financial assistance, healthcare support, rehabilitation
              services, and recognition programs to honor the contributions of
              those who have served in the Canadian Armed Forces. Additionally,
              the department is responsible for remembrance initiatives that
              preserve Canada's military history.
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
              value="$6.1B"
              subtitle={t`Was spent by the Dept. of Veterans Affairs`}
            />
            <StatCard
              title={t`In FY 2024,`}
              value="1.2%"
              subtitle={t`Of federal spending was by the Dept. of Veterans Affairs`}
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              VAC spent $6.1 billion in fiscal year (FY) 2024. This was 1.2% of
              the $513.9 billion in overall federal spending. The department
              ranked thirteenth among federal departments in total spending.
            </Trans>
          </P>

          <H3>
            <Trans>
              VAC accounted for 1.2% of all federal spending in FY 2024. 10
              government departments accounted for 73.2% of federal spending in
              FY 2024
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
              Since 1995, overall federal spending has risen 77%, while VAC
              spending has increased 51%.
            </Trans>
          </P>
          <P>
            <Trans>
              The department's spending has grown less than overall spending,
              which means that the department's share of the federal budget has
              increased. In FY 2024, VAC accounted for 1.1% of all federal
              spending, about the same share as in 1995.
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
              VAC's expenditures also grew slightly during this period,
              increasing from approximately $5.5B​ in 2019 when adjusted for
              inflation to $6.3B in 2024.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>How did VAC spend its budget in FY24?</Trans>
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
              In FY 2024, VAC reported total expenditures of $6.07 billion
              across two entities:
            </Trans>
          </P>
          <ChartContainer>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who Leads Veterans Affairs Canada (VAC)?</Trans>
          </H2>
          <P>
            <Trans>
              Veterans Affairs Canada (VAC) is led by the Minister of Veterans
              Affairs, who is appointed by the Governor General on the advice of
              the Prime Minister and formally sworn into office at Rideau Hall.
              Upon appointment, the Minister takes the Oath of Office and the
              Oath of Allegiance, becoming a member of the King's Privy Council
              for Canada.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister of Veterans Affairs is one of the cabinet members who
              serve at the Prime Minister's discretion. Their tenure typically
              ends when they resign, are replaced, or when a new Prime Minister
              appoints a new cabinet. Outgoing ministers continue in their roles
              until their successors are sworn in.
            </Trans>
          </P>
          <P>
            <Trans>
              The Minister is responsible for overseeing benefits and services
              for veterans, ensuring their well-being, and leading national
              remembrance initiatives.
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
