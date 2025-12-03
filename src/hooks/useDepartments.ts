import { useLingui } from "@lingui/react/macro";

export const useDepartments = () => {
  const { t, i18n } = useLingui();

  const departments = [
    {
      name: t`Finance Canada`,
      slug: "department-of-finance",
      href: `/${i18n.locale}/federal/spending/department-of-finance`,
      Percentage: 26.48,
    },
    {
      name: t`Employment and Social Development Canada`,
      slug: "employment-and-social-development-canada",
      href: `/${i18n.locale}/federal/spending/employment-and-social-development-canada`,
      Percentage: 18.38,
    },
    {
      name: t`Indigenous Services Canada + Crown-Indigenous Relations and Northern Affairs Canada`,
      slug: "indigenous-services-and-northern-affairs",
      href: `/${i18n.locale}/federal/spending/indigenous-services-and-northern-affairs`,
      Percentage: 12.25,
    },
    {
      name: t`National Defence`,
      slug: "national-defence",
      href: `/${i18n.locale}/federal/spending/national-defence`,
      Percentage: 6.71,
    },
    {
      name: t`Global Affairs Canada`,
      slug: "global-affairs-canada",
      href: `/${i18n.locale}/federal/spending/global-affairs-canada`,
      Percentage: 3.74,
    },
    {
      name: t`Canada Revenue Agency`,
      slug: "canada-revenue-agency",
      href: `/${i18n.locale}/federal/spending/canada-revenue-agency`,
      Percentage: 3.27,
    },
    {
      name: t`Housing, Infrastructure and Communities Canada`,
      slug: "housing-infrastructure-communities",
      href: `/${i18n.locale}/federal/spending/housing-infrastructure-communities`,
      Percentage: 2.82,
    },
    {
      name: t`Public Safety Canada`,
      slug: "public-safety-canada",
      href: `/${i18n.locale}/federal/spending/public-safety-canada`,
      Percentage: 2.71,
    },
    {
      name: t`Health Canada`,
      slug: "health-canada",
      href: `/${i18n.locale}/federal/spending/health-canada`,
      Percentage: 2.67,
    },
    {
      name: t`Innovation, Science and Industry`,
      slug: "innovation-science-and-industry",
      href: `/${i18n.locale}/federal/spending/innovation-science-and-industry`,
      Percentage: 2.0,
    },
    {
      name: t`Public Services and Procurement Canada`,
      slug: "public-services-and-procurement-canada",
      href: `/${i18n.locale}/federal/spending/public-services-and-procurement-canada`,
      Percentage: 1.6,
    },
    {
      name: t`Immigration, Refugees and Citizenship`,
      slug: "immigration-refugees-and-citizenship",
      href: `/${i18n.locale}/federal/spending/immigration-refugees-and-citizenship`,
      Percentage: 1.2,
    },
    {
      name: t`Veterans Affairs`,
      slug: "veterans-affairs",
      href: `/${i18n.locale}/federal/spending/veterans-affairs`,
      Percentage: 1.2,
    },
    {
      name: t`Transport Canada`,
      slug: "transport-canada",
      href: `/${i18n.locale}/federal/spending/transport-canada`,
      Percentage: 1.0,
    },
  ];

  return departments.sort((a, b) => b.Percentage - a.Percentage);
};

export const useFindDepartment = (slug: string) => {
  const departments = useDepartments();
  const found = departments.find((department) => department.slug === slug);

  if (!found) {
    throw new Error(`Department not found: ${slug}`);
  }

  return found;
};
