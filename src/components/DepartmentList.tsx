"use client";

import { InternalLink } from "@/components/Layout";
import { Department, Jurisdiction } from "@/lib/jurisdictions";
import { Trans, useLingui } from "@lingui/react/macro";

// Federal department list for the budget pages' "Government Departments
// explained" section. Slugs link to the legacy yearless department URL, which
// next.config redirects to the data-driven /federal/spending/{defaultYear}/{slug}
// page. (The federal spending pages themselves are fully data-driven and no
// longer use this component.)
const useFederalDepartments = () => {
  const { t } = useLingui();
  return [
    { name: t`Finance Canada`, slug: "department-of-finance" },
    {
      name: t`Employment and Social Development Canada`,
      slug: "employment-and-social-development-canada",
    },
    {
      name: t`Indigenous Services Canada + Crown-Indigenous Relations and Northern Affairs Canada`,
      slug: "indigenous-services-and-northern-affairs",
    },
    { name: t`National Defence`, slug: "national-defence" },
    { name: t`Global Affairs Canada`, slug: "global-affairs-canada" },
    { name: t`Canada Revenue Agency`, slug: "canada-revenue-agency" },
    {
      name: t`Housing, Infrastructure and Communities Canada`,
      slug: "housing-infrastructure-communities",
    },
    { name: t`Public Safety Canada`, slug: "public-safety-canada" },
    { name: t`Health Canada`, slug: "health-canada" },
    {
      name: t`Innovation, Science and Industry`,
      slug: "innovation-science-and-industry",
    },
    {
      name: t`Public Services and Procurement Canada`,
      slug: "public-services-and-procurement-canada",
    },
    {
      name: t`Immigration, Refugees and Citizenship`,
      slug: "immigration-refugees-and-citizenship",
    },
    { name: t`Veterans Affairs`, slug: "veterans-affairs" },
    { name: t`Transport Canada`, slug: "transport-canada" },
  ];
};

interface DepartmentProps {
  name: string;
  slug: string;
  href?: string;
}

const DepartmentItem = ({ name, slug }: DepartmentProps) => {
  const { i18n } = useLingui();
  return (
    <div className="py-3 border-b border-gray-200">
      <InternalLink
        href={`/${i18n.locale}/federal/spending/${slug}`}
        className="font-medium text-gray-600"
      >
        {name}
      </InternalLink>
    </div>
  );
};

export const DepartmentList = (props: { current?: string }) => {
  const departments = useFederalDepartments();
  const BrowsableDepartment = departments
    .filter((d) => !!d.slug && !!d.name)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")) as {
    name: string;
    slug: string;
  }[];

  return (
    <div className="text-gray-600 leading-relaxed mb-4">
      {BrowsableDepartment.filter((d) => {
        return d.name !== props.current || d.slug !== props.current;
      }).map((department) => (
        <DepartmentItem key={department.slug} {...department} />
      ))}
      <div className="py-3 border-b border-gray-200">
        <Trans>More coming soon...</Trans>
      </div>
    </div>
  );
};

interface JurisdictionDepartmentProps {
  jurisdiction: Jurisdiction;
  department: Department;
  lang: string;
  basePath?: string;
}

const JurisdictionDepartmentItem = ({
  lang,
  jurisdiction,
  department,
  basePath,
}: JurisdictionDepartmentProps) => {
  const href = basePath
    ? `${basePath}/departments/${department.slug}`
    : `/${lang}/${jurisdiction.slug}/${department.slug}`;

  return (
    <div className="py-3 border-b border-gray-200">
      <InternalLink href={href} className="font-medium text-gray-600">
        <Trans>{department.name}</Trans>
      </InternalLink>
    </div>
  );
};

export const JurisdictionDepartmentList = (props: {
  lang: string;
  jurisdiction: Jurisdiction;
  departments: Department[];
  current?: string;
  basePath?: string;
}) => {
  const BrowsableDepartment = props.departments
    .filter((d) => !!d.slug && !!d.name)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  return (
    <div className="text-gray-600 leading-relaxed mb-4">
      {BrowsableDepartment.filter((d) => {
        return d.slug !== props.current;
      }).map((department) => (
        <JurisdictionDepartmentItem
          key={department.slug}
          lang={props.lang}
          jurisdiction={props.jurisdiction}
          department={department}
          basePath={props.basePath}
        />
      ))}
    </div>
  );
};
