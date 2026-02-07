"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.0584,
  },
  {
    Year: "1996",
    Percentage: 0.0571,
  },
  {
    Year: "1997",
    Percentage: 0.0117,
  },
  {
    Year: "1998",
    Percentage: 0.0126,
  },
  {
    Year: "1999",
    Percentage: 0.0149,
  },
  {
    Year: "2000",
    Percentage: 0.0209,
  },
  {
    Year: "2001",
    Percentage: 0.0168,
  },
  {
    Year: "2002",
    Percentage: 0.0195,
  },
  {
    Year: "2003",
    Percentage: 0.0183,
  },
  {
    Year: "2004",
    Percentage: 0.0253,
  },
  {
    Year: "2005",
    Percentage: 0.0198,
  },
  {
    Year: "2006",
    Percentage: 0.02,
  },
  {
    Year: "2007",
    Percentage: 0.0196,
  },
  {
    Year: "2008",
    Percentage: 0.0253,
  },
  {
    Year: "2009",
    Percentage: 0.0219,
  },
  {
    Year: "2010",
    Percentage: 0.0208,
  },
  {
    Year: "2011",
    Percentage: 0.02,
  },
  {
    Year: "2012",
    Percentage: 0.0203,
  },
  {
    Year: "2013",
    Percentage: 0.02,
  },
  {
    Year: "2014",
    Percentage: 0.0239,
  },
  {
    Year: "2015",
    Percentage: 0.0226,
  },
  {
    Year: "2016",
    Percentage: 0.021,
  },
  {
    Year: "2017",
    Percentage: 0.0212,
  },
  {
    Year: "2018",
    Percentage: 0.0179,
  },
  {
    Year: "2019",
    Percentage: 0.0144,
  },
  {
    Year: "2020",
    Percentage: 0.0153,
  },
  {
    Year: "2021",
    Percentage: 0.0226,
  },
  {
    Year: "2022",
    Percentage: 0.0344,
  },
  {
    Year: "2023",
    Percentage: 0.0263,
  },
  {
    Year: "2024",
    Percentage: 0.0267,
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
