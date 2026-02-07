"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.031,
  },
  {
    Year: "1996",
    Percentage: 0.0327,
  },
  {
    Year: "1997",
    Percentage: 0.0285,
  },
  {
    Year: "1998",
    Percentage: 0.0304,
  },
  {
    Year: "1999",
    Percentage: 0.0322,
  },
  {
    Year: "2000",
    Percentage: 0.0306,
  },
  {
    Year: "2001",
    Percentage: 0.0316,
  },
  {
    Year: "2002",
    Percentage: 0.0313,
  },
  {
    Year: "2003",
    Percentage: 0.0293,
  },
  {
    Year: "2004",
    Percentage: 0.0288,
  },
  {
    Year: "2005",
    Percentage: 0.0267,
  },
  {
    Year: "2006",
    Percentage: 0.0279,
  },
  {
    Year: "2007",
    Percentage: 0.0284,
  },
  {
    Year: "2008",
    Percentage: 0.0335,
  },
  {
    Year: "2009",
    Percentage: 0.0292,
  },
  {
    Year: "2010",
    Percentage: 0.0271,
  },
  {
    Year: "2011",
    Percentage: 0.0305,
  },
  {
    Year: "2012",
    Percentage: 0.0291,
  },
  {
    Year: "2013",
    Percentage: 0.0294,
  },
  {
    Year: "2014",
    Percentage: 0.0291,
  },
  {
    Year: "2015",
    Percentage: 0.0275,
  },
  {
    Year: "2016",
    Percentage: 0.0269,
  },
  {
    Year: "2017",
    Percentage: 0.0294,
  },
  {
    Year: "2018",
    Percentage: 0.0371,
  },
  {
    Year: "2019",
    Percentage: 0.0463,
  },
  {
    Year: "2020",
    Percentage: 0.0538,
  },
  {
    Year: "2021",
    Percentage: 0.0346,
  },
  {
    Year: "2022",
    Percentage: 0.0472,
  },
  {
    Year: "2023",
    Percentage: 0.0673,
  },
  {
    Year: "2024",
    Percentage: 0.1225,
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
