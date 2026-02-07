"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.328,
  },
  {
    Year: "1996",
    Percentage: 0.363,
  },
  {
    Year: "1997",
    Percentage: 0.4626,
  },
  {
    Year: "1998",
    Percentage: 0.4305,
  },
  {
    Year: "1999",
    Percentage: 0.4614,
  },
  {
    Year: "2000",
    Percentage: 0.4609,
  },
  {
    Year: "2001",
    Percentage: 0.4605,
  },
  {
    Year: "2002",
    Percentage: 0.4252,
  },
  {
    Year: "2003",
    Percentage: 0.3663,
  },
  {
    Year: "2004",
    Percentage: 0.3661,
  },
  {
    Year: "2005",
    Percentage: 0.3481,
  },
  {
    Year: "2006",
    Percentage: 0.3805,
  },
  {
    Year: "2007",
    Percentage: 0.3316,
  },
  {
    Year: "2008",
    Percentage: 0.3495,
  },
  {
    Year: "2009",
    Percentage: 0.3294,
  },
  {
    Year: "2010",
    Percentage: 0.2859,
  },
  {
    Year: "2011",
    Percentage: 0.3113,
  },
  {
    Year: "2012",
    Percentage: 0.3116,
  },
  {
    Year: "2013",
    Percentage: 0.3052,
  },
  {
    Year: "2014",
    Percentage: 0.3107,
  },
  {
    Year: "2015",
    Percentage: 0.3074,
  },
  {
    Year: "2016",
    Percentage: 0.2945,
  },
  {
    Year: "2017",
    Percentage: 0.285,
  },
  {
    Year: "2018",
    Percentage: 0.2725,
  },
  {
    Year: "2019",
    Percentage: 0.2728,
  },
  {
    Year: "2020",
    Percentage: 0.2734,
  },
  {
    Year: "2021",
    Percentage: 0.1877,
  },
  {
    Year: "2022",
    Percentage: 0.2165,
  },
  {
    Year: "2023",
    Percentage: 0.2488,
  },
  {
    Year: "2024",
    Percentage: 0.2648,
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
