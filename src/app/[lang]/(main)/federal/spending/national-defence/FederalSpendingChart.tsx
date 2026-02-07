"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.0734,
  },
  {
    Year: "1996",
    Percentage: 0.0715,
  },
  {
    Year: "1997",
    Percentage: 0.0706,
  },
  {
    Year: "1998",
    Percentage: 0.0681,
  },
  {
    Year: "1999",
    Percentage: 0.0671,
  },
  {
    Year: "2000",
    Percentage: 0.0751,
  },
  {
    Year: "2001",
    Percentage: 0.071,
  },
  {
    Year: "2002",
    Percentage: 0.0745,
  },
  {
    Year: "2003",
    Percentage: 0.0678,
  },
  {
    Year: "2004",
    Percentage: 0.0696,
  },
  {
    Year: "2005",
    Percentage: 0.0663,
  },
  {
    Year: "2006",
    Percentage: 0.0703,
  },
  {
    Year: "2007",
    Percentage: 0.0706,
  },
  {
    Year: "2008",
    Percentage: 0.0753,
  },
  {
    Year: "2009",
    Percentage: 0.0804,
  },
  {
    Year: "2010",
    Percentage: 0.0725,
  },
  {
    Year: "2011",
    Percentage: 0.0751,
  },
  {
    Year: "2012",
    Percentage: 0.0755,
  },
  {
    Year: "2013",
    Percentage: 0.0741,
  },
  {
    Year: "2014",
    Percentage: 0.0694,
  },
  {
    Year: "2015",
    Percentage: 0.0689,
  },
  {
    Year: "2016",
    Percentage: 0.0651,
  },
  {
    Year: "2017",
    Percentage: 0.0617,
  },
  {
    Year: "2018",
    Percentage: 0.0707,
  },
  {
    Year: "2019",
    Percentage: 0.0644,
  },
  {
    Year: "2020",
    Percentage: 0.0651,
  },
  {
    Year: "2021",
    Percentage: 0.0439,
  },
  {
    Year: "2022",
    Percentage: 0.0506,
  },
  {
    Year: "2023",
    Percentage: 0.0589,
  },
  {
    Year: "2024",
    Percentage: 0.0671,
  },
];

export const FederalSpendingChart = () => {
  return (
    <LineChart
      data={chartdata}
      index="Year"
      categories={["Percentage"]}
      showLegend={false}
      valueFormatter={(number: number) =>
        Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(number)
      }
    />
  );
};
