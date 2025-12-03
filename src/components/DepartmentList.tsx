"use client";

import { InternalLink } from "@/components/Layout";
import { useDepartments } from "@/hooks/useDepartments";
import { Department, Jurisdiction } from "@/lib/jurisdictions";
import { Trans, useLingui } from "@lingui/react/macro";

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
  const departments = useDepartments();
  const BrowsableDepartment = departments
    .filter((d) => !!d.href && !!d.slug && !!d.name)
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
