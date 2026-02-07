"use client";

import { BarList } from "@/components/BarList";
import { formatNumber } from "@/components/Sankey/utils";

const data = [
  { name: "Royal Canadian Mounted Police", value: 5.143298 },
  { name: "Correctional Service of Canada", value: 3.374962 },
  { name: "Canada Border Services Agency", value: 2.693911 },
  {
    name: "Department of Public Safety and Emergency Preparedness",
    value: 1.484124,
  },
  { name: "Canadian Security Intelligence Service", value: 0.82841 },
  { name: "Chief Electoral Officer", value: 0.249066 },
  { name: "Parole Board of Canada", value: 0.077448 },
  { name: "The Jacques-Cartier and Champlain Bridges Inc", value: 0.156303 },
  { name: "Commissioner of Official Languages", value: 0.025086 },
  {
    name: "Civilian Review and Complaints Commission for the RCMP",
    value: 0.015795,
  },
  {
    name: "Canadian Intergovernmental Conference Secretariat",
    value: 0.007923,
  },
  { name: "Correctional Investigator of Canada", value: 0.005813 },
  { name: "RCMP External Review Committee", value: 0.005372 },
  { name: "Leaders' Debates Commission", value: 0.000644 },
].sort((a, b) => b.value - a.value);

export function FederalSpendingByEntity() {
  return (
    <BarList
      data={data}
      valueFormatter={(number: number) => formatNumber(number, 1e9)}
    />
  );
}
