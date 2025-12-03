import {
  getDepartmentData,
  getDepartmentsForJurisdiction,
  getExpandedDepartments,
  getJurisdictionData,
  getProvincialSlugs,
  getAvailableYearsForJurisdiction,
} from "@/lib/jurisdictions";
import { locales } from "@/lib/constants";

export const dynamicParams = false;

export async function generateStaticParams() {
  const provinces = getProvincialSlugs();

  return locales.flatMap((lang) =>
    provinces.flatMap((province) => {
      const years = getAvailableYearsForJurisdiction(province);
      return years.flatMap((year) => {
        const departments = getDepartmentsForJurisdiction(province, year);
        return departments.map((department) => ({
          lang,
          province,
          year,
          department,
        }));
      });
    }),
  );
}

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
import { StatCard, StatCardContainer } from "@/components/StatCard";
import { initLingui } from "@/initLingui";
import { Trans } from "@lingui/react/macro";
import { DepartmentMiniSankey } from "@/components/Sankey/DepartmentMiniSankey";
import { JurisdictionDepartmentList } from "@/components/DepartmentList";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{
    lang: string;
    province: string;
    year: string;
    department: string;
  }>;
}) {
  const { lang, province, year, department: departmentSlug } = await params;

  initLingui(lang);

  const { jurisdiction } = getJurisdictionData(province, year);
  const departments = getExpandedDepartments(province, year);

  const department = getDepartmentData(province, departmentSlug, year);

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>{department.name}</Trans>
          </H1>
          {department.introText.split("\n\n").map((paragraph, index) => (
            <div key={index}>
              {paragraph.startsWith("•") ? (
                <div className="mt-4">
                  <ul className="list-disc pl-6 space-y-2">
                    {paragraph
                      .split("\n")
                      .filter((line) => line.trim().startsWith("•"))
                      .map((item, itemIndex) => {
                        const cleanItem = item.replace("• ", "");
                        const parts = cleanItem.split(" – ");
                        return (
                          <li key={itemIndex} className="text-gray-700">
                            <strong>{parts[0]}</strong>
                            {parts[1] && ` – ${parts[1]}`}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ) : (
                <Intro>
                  {paragraph.match(/\*\*([^*]+)\*\*/) ||
                  paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: paragraph
                          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                          .replace(
                            /\[([^\]]+)\]\(([^)]+)\)/g,
                            '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">$1</a>',
                          ),
                      }}
                    />
                  ) : (
                    <Trans>{paragraph}</Trans>
                  )}
                </Intro>
              )}
            </div>
          ))}

          <H2>
            <Trans>Department Spending</Trans>
          </H2>

          <StatCardContainer>
            <StatCard
              title={
                <Trans>In Financial Year {jurisdiction.financialYear},</Trans>
              }
              value={department.totalSpendingFormatted}
              subtitle={<Trans>was spent by {department.name}</Trans>}
            />
            <StatCard
              title={
                <Trans>In Financial Year {jurisdiction.financialYear},</Trans>
              }
              value={department.percentageFormatted}
              subtitle={
                <Trans>
                  of {jurisdiction.name} provincial spending was by{" "}
                  {department.name}
                </Trans>
              }
            />
          </StatCardContainer>

          <div className="mt-6"></div>

          {department.descriptionText.split("\n\n").map((paragraph, index) => (
            <P key={index}>
              <Trans>{paragraph}</Trans>
            </P>
          ))}

          {department.roleText.split("\n\n").map((paragraph, index) => (
            <P key={index}>
              {paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: paragraph.replace(
                      /\[([^\]]+)\]\(([^)]+)\)/g,
                      '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">$1</a>',
                    ),
                  }}
                />
              ) : (
                <Trans>{paragraph}</Trans>
              )}
            </P>
          ))}

          <ChartContainer>
            <DepartmentMiniSankey department={department} />
          </ChartContainer>

          <div className="mt-8"></div>

          {department.budgetProjectionsText && (
            <div>
              {department.budgetProjectionsText
                .split("\n\n")
                .map((paragraph, index) => (
                  <P key={index}>
                    {paragraph.match(/\*\*([^*]+)\*\*/) ||
                    paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
                      <span
                        dangerouslySetInnerHTML={{
                          __html: paragraph
                            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
                            .replace(
                              /\[([^\]]+)\]\(([^)]+)\)/g,
                              '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">$1</a>',
                            ),
                        }}
                      />
                    ) : (
                      <Trans>{paragraph}</Trans>
                    )}
                  </P>
                ))}
            </div>
          )}

          <div className="mt-8"></div>

          {department.agenciesHeading && department.agenciesDescription && (
            <Section>
              <H2>
                <Trans>{department.agenciesHeading}</Trans>
              </H2>
              <div>
                {department.agenciesDescription
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <div key={index}>
                      {paragraph.startsWith("•") ? (
                        <ul className="list-disc pl-6 space-y-2">
                          {paragraph
                            .split("\n")
                            .filter((line) => line.trim().startsWith("•"))
                            .map((item, itemIndex) => {
                              const cleanItem = item.replace("• ", "");
                              const parts = cleanItem.split(" – ");
                              return (
                                <li key={itemIndex} className="text-gray-700">
                                  {parts[0].match(/\*\*([^*]+)\*\*/) ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: parts[0].replace(
                                          /\*\*([^*]+)\*\*/g,
                                          "<strong>$1</strong>",
                                        ),
                                      }}
                                    />
                                  ) : (
                                    <span>{parts[0]}</span>
                                  )}
                                  {parts[1] && ` – ${parts[1]}`}
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <P>
                          <Trans>{paragraph}</Trans>
                        </P>
                      )}
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {department.programsDescription && (
            <div className="mt-6">
              <div>
                {department.programsDescription
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <div key={index}>
                      {paragraph.startsWith("•") ? (
                        <ul className="list-disc pl-6 space-y-2">
                          {paragraph
                            .split("\n")
                            .filter((line) => line.trim().startsWith("•"))
                            .map((item, itemIndex) => {
                              const cleanItem = item.replace("• ", "");
                              const parts = cleanItem.split(" – ");
                              return (
                                <li key={itemIndex} className="text-gray-700">
                                  {parts[0].match(/\*\*([^*]+)\*\*/) ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: parts[0].replace(
                                          /\*\*([^*]+)\*\*/g,
                                          "<strong>$1</strong>",
                                        ),
                                      }}
                                    />
                                  ) : (
                                    <span>{parts[0]}</span>
                                  )}
                                  {parts[1] && ` – ${parts[1]}`}
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <P>
                          <Trans>{paragraph}</Trans>
                        </P>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-8"></div>

          {department.prioritiesHeading && department.prioritiesDescription && (
            <Section>
              <H2>
                <Trans>{department.prioritiesHeading}</Trans>
              </H2>
              <div>
                {department.prioritiesDescription
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <div key={index}>
                      {paragraph.startsWith("•") ? (
                        <ul className="list-disc pl-6 space-y-2">
                          {paragraph
                            .split("\n")
                            .filter((line) => line.trim().startsWith("•"))
                            .map((item, itemIndex) => {
                              const cleanItem = item.replace("• ", "");
                              const parts = cleanItem.split(" – ");
                              return (
                                <li key={itemIndex} className="text-gray-700">
                                  <strong>{parts[0]}</strong>
                                  {parts[1] && ` – ${parts[1]}`}
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <P>
                          <Trans>{paragraph}</Trans>
                        </P>
                      )}
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {department.leadershipHeading && department.leadershipDescription && (
            <Section>
              <H2>
                <Trans>{department.leadershipHeading}</Trans>
              </H2>
              <div>
                {department.leadershipDescription
                  .split("\n\n")
                  .map((paragraph, index) => (
                    <div key={index}>
                      {paragraph.startsWith("•") ? (
                        <ul className="list-disc pl-6 space-y-2">
                          {paragraph
                            .split("\n")
                            .filter((line) => line.trim().startsWith("•"))
                            .map((item, itemIndex) => {
                              const cleanItem = item.replace("• ", "");
                              const parts = cleanItem.split(" – ");
                              return (
                                <li key={itemIndex} className="text-gray-700">
                                  {parts[0].match(/\*\*([^*]+)\*\*/) ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html: parts[0].replace(
                                          /\*\*([^*]+)\*\*/g,
                                          "<strong>$1</strong>",
                                        ),
                                      }}
                                    />
                                  ) : (
                                    <span>{parts[0]}</span>
                                  )}
                                  {parts[1] && ` – ${parts[1]}`}
                                </li>
                              );
                            })}
                        </ul>
                      ) : (
                        <P>
                          {paragraph.match(/\*\*([^*]+)\*\*/) ||
                          paragraph.match(/\[([^\]]+)\]\(([^)]+)\)/) ? (
                            <span
                              dangerouslySetInnerHTML={{
                                __html: paragraph
                                  .replace(
                                    /\*\*([^*]+)\*\*/g,
                                    "<strong>$1</strong>",
                                  )
                                  .replace(
                                    /\[([^\]]+)\]\(([^)]+)\)/g,
                                    '<a href="$2" class="text-blue-500 underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">$1</a>',
                                  ),
                              }}
                            />
                          ) : (
                            <Trans>{paragraph}</Trans>
                          )}
                        </P>
                      )}
                    </div>
                  ))}
              </div>
            </Section>
          )}

          <Section>
            <H2>
              <Trans>Other {jurisdiction.name} Government Ministries</Trans>
            </H2>
            <JurisdictionDepartmentList
              jurisdiction={jurisdiction}
              lang={lang}
              departments={departments}
              current={department.slug}
              basePath={`/${lang}/provincial/${province}/${year}`}
            />
          </Section>
        </Section>
      </PageContent>
    </Page>
  );
}
