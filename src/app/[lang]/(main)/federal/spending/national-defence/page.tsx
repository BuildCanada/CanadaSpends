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
    title: t`National Defence | Canada Spends`,
    description: t`A look at how National Defence spends its budget`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function Department(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const { t } = useLingui();
  const department = useFindDepartment("national-defence");
  return (
    <Page>
      <PageContent>
        <Section>
          <H1>{department.name}</H1>
          <Intro>
            <Trans>
              The Department of National Defence (DND) and the Canadian Armed
              Forces (CAF) are responsible for ensuring Canada's security and
              defence through military operations, infrastructure management,
              and personnel support. Established in 1923 under the National
              Defence Act, DND oversees the defence budget, military
              procurement, and readiness planning, while the CAF executes
              domestic and international operations. The department provides
              strategic defence policy guidance and works with international
              allies, including NATO and NORAD, to ensure national security. DND
              also administers military health services, housing programs, and
              recruitment initiatives to support its personnel.
            </Trans>
          </Intro>
        </Section>

        <Section>
          <UpdatedAt>
            <Trans>Data updated March 21, 2025</Trans>
          </UpdatedAt>
          <StatCardContainer>
            <StatCard
              title={<Trans>In FY 2024,</Trans>}
              value="$34.5B"
              subtitle={
                <Trans>was spent by the Department of National Defence</Trans>
              }
            />
            <StatCard
              title={<Trans>In FY 2024,</Trans>}
              value="6.7%"
              subtitle={
                <Trans>
                  of federal spending was by the Department of National Defence
                </Trans>
              }
            />
          </StatCardContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              The Department of National Defence spent $34.5 billion in fiscal
              year (FY) 2024. This represented 6.7% of the $513.9 billion in
              total federal spending. DND ranked among the top federal
              departments in expenditures, largely driven by personnel costs,
              military procurement, and operational readiness efforts.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>
              National Defence accounted for 6.7% of all federal spending in FY
              2024
            </Trans>
          </H2>

          <ChartContainer>
            <H3>
              <Trans>
                10 government departments accounted for 73.2% of federal
                spending in FY 2024.
              </Trans>
            </H3>
            <DepartmentSpendingChart department={department.slug} />
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Federal spending may shift over time due to geopolitical tensions,
              defence modernization needs, and emerging threats such as cyber
              warfare. Since 1995, overall federal spending has risen 74.9%,
              while Department of National Defence spending has increased 59.9%.
            </Trans>
          </P>
          <P>
            <Trans>
              DND's spending grew less than overall spending, meaning its share
              of the federal budget decreased. In 2024, the department accounted
              for 6.7% of all federal spending, 0.6 percentage points lower than
              in 1995.
            </Trans>
          </P>
        </Section>
        <Section>
          <H2>
            <Trans>
              National Defence's share of federal spending in FY 2024 was lower
              than in FY 1995
            </Trans>
          </H2>

          <ChartContainer>
            <H3>
              <Trans>
                Percentage of federal budget dedicated to Defence, FYs 1995-2024
              </Trans>
            </H3>
            <FederalSpendingChart />
          </ChartContainer>
          <P>
            <Trans>
              Major legislation, shifts in international security dynamics, and
              acute events such as Russia's invasion of Ukraine or Arctic
              sovereignty disputes can influence military spending.
            </Trans>
          </P>
        </Section>
        <Section>
          <H2>
            <Trans>
              How did the Department of National Defence spend its budget in
              2024?
            </Trans>
          </H2>

          <ChartContainer>
            <NoSSR>
              <MiniSankey />
            </NoSSR>
          </ChartContainer>
        </Section>

        <Section>
          <P>
            <Trans>
              Most federal spending can be categorized as direct or indirect.
              Direct spending refers to money the federal government spends on
              budget items such as federal programs, employee salaries, and debt
              interest. Indirect spending refers to federal transfers to other
              levels of government.
            </Trans>
          </P>

          <ChartContainer>
            <P>
              <Trans>
                Federal departments often include additional agencies, commands,
                and operational divisions. In FY 2024, the largest spending
                entities within DND were the Canadian Army, the Royal Canadian
                Navy, and the Royal Canadian Air Force, accounting for the bulk
                of military expenditures.
              </Trans>
            </P>
            <H3>
              <Trans>National Defence, Spending by Entity, FY 2024</Trans>
            </H3>
            <FederalSpendingByEntity />
          </ChartContainer>
        </Section>

        <Section>
          <H2>
            <Trans>Who leads the Department of National Defence?</Trans>
          </H2>
          <P>
            <Trans>
              The Department of National Defence is led by the{" "}
              <ExternalLink href="https://www.pm.gc.ca/en/cabinet/honourable-bill-blair">
                Minister of National Defence
              </ExternalLink>
              , who is appointed by the Governor General on the advice of the
              Prime Minister. The minister is responsible for overseeing
              national defense policy, military operations, and procurement.
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
