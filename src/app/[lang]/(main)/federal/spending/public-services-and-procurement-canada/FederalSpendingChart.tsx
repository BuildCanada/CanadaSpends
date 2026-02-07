"use client";

import { LineChart } from "@/components/LineChart";

// This is placeholder data - Replace with real data from TAB 36
const chartdata = [
  // Use this format for historical spending data
  {
    Year: "1995",
    Percentage: 0.026,
  },
  {
    Year: "1996",
    Percentage: 0.025,
  },
  {
    Year: "1997",
    Percentage: 0.024,
  },
  {
    Year: "1998",
    Percentage: 0.023,
  },
  {
    Year: "1999",
    Percentage: 0.022,
  },
  {
    Year: "2000",
    Percentage: 0.021,
  },
  {
    Year: "2001",
    Percentage: 0.02,
  },
  {
    Year: "2002",
    Percentage: 0.019,
  },
  {
    Year: "2003",
    Percentage: 0.018,
  },
  {
    Year: "2004",
    Percentage: 0.017,
  },
  {
    Year: "2005",
    Percentage: 0.019,
  },
  {
    Year: "2006",
    Percentage: 0.018,
  },
  {
    Year: "2007",
    Percentage: 0.017,
  },
  {
    Year: "2008",
    Percentage: 0.018,
  },
  {
    Year: "2009",
    Percentage: 0.019,
  },
  {
    Year: "2010",
    Percentage: 0.018,
  },
  {
    Year: "2011",
    Percentage: 0.017,
  },
  {
    Year: "2012",
    Percentage: 0.018,
  },
  {
    Year: "2013",
    Percentage: 0.017,
  },
  {
    Year: "2014",
    Percentage: 0.016,
  },
  {
    Year: "2015",
    Percentage: 0.016,
  },
  {
    Year: "2016",
    Percentage: 0.017,
  },
  {
    Year: "2017",
    Percentage: 0.016,
  },
  {
    Year: "2018",
    Percentage: 0.017,
  },
  {
    Year: "2019",
    Percentage: 0.017,
  },
  {
    Year: "2020",
    Percentage: 0.016,
  },
  {
    Year: "2021",
    Percentage: 0.014,
  },
  {
    Year: "2022",
    Percentage: 0.015,
  },
  {
    Year: "2023",
    Percentage: 0.015,
  },
  {
    Year: "2024",
    Percentage: 0.016,
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
