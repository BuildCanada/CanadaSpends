"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.0245,
  },
  {
    Year: "1996",
    Percentage: 0.0207,
  },
  {
    Year: "1997",
    Percentage: 0.0221,
  },
  {
    Year: "1998",
    Percentage: 0.0225,
  },
  {
    Year: "1999",
    Percentage: 0.016,
  },
  {
    Year: "2000",
    Percentage: 0.0234,
  },
  {
    Year: "2001",
    Percentage: 0.0237,
  },
  {
    Year: "2002",
    Percentage: 0.0248,
  },
  {
    Year: "2003",
    Percentage: 0.0235,
  },
  {
    Year: "2004",
    Percentage: 0.0244,
  },
  {
    Year: "2005",
    Percentage: 0.0263,
  },
  {
    Year: "2006",
    Percentage: 0.0254,
  },
  {
    Year: "2007",
    Percentage: 0.0269,
  },
  {
    Year: "2008",
    Percentage: 0.026,
  },
  {
    Year: "2009",
    Percentage: 0.0263,
  },
  {
    Year: "2010",
    Percentage: 0.0508,
  },
  {
    Year: "2011",
    Percentage: 0.0248,
  },
  {
    Year: "2012",
    Percentage: 0.0252,
  },
  {
    Year: "2013",
    Percentage: 0.0229,
  },
  {
    Year: "2014",
    Percentage: 0.0224,
  },
  {
    Year: "2015",
    Percentage: 0.0222,
  },
  {
    Year: "2016",
    Percentage: 0.0209,
  },
  {
    Year: "2017",
    Percentage: 0.0206,
  },
  {
    Year: "2018",
    Percentage: 0.0204,
  },
  {
    Year: "2019",
    Percentage: 0.0209,
  },
  {
    Year: "2020",
    Percentage: 0.0203,
  },
  {
    Year: "2021",
    Percentage: 0.0155,
  },
  {
    Year: "2022",
    Percentage: 0.0197,
  },
  {
    Year: "2023",
    Percentage: 0.0239,
  },
  {
    Year: "2024",
    Percentage: 0.0374,
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
