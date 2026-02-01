"use client";

import { BarList } from "@/components/BarList";
import { useDepartments } from "@/hooks/useDepartments";
import { useMemo } from "react";

export function DepartmentSpendingChart(props: {
  department: string | string[];
}) {
  const departments = useDepartments();
  const deps = useMemo(
    () =>
      Array.isArray(props.department) ? props.department : [props.department],
    [props.department],
  );
  const data = useMemo(() => {
    return departments.slice(0, 10).map((item) => ({
      name: item.name,
      href: item.href,
      value: item.Percentage,
      className:
        deps.includes(item.name) || deps.includes(item.slug)
          ? "bg-pine-300"
          : "",
    }));
  }, [departments, deps]);

  return (
    <BarList
      data={data}
      valueFormatter={(number: number) =>
        Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(number / 100)
      }
    />
  );
}
