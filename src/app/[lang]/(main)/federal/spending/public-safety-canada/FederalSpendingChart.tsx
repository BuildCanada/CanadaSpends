"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.0163,
  },
  {
    Year: "1996",
    Percentage: 0.0166,
  },
  {
    Year: "1997",
    Percentage: 0.0176,
  },
  {
    Year: "1998",
    Percentage: 0.0183,
  },
  {
    Year: "1999",
    Percentage: 0.0181,
  },
  {
    Year: "2000",
    Percentage: 0.0196,
  },
  {
    Year: "2001",
    Percentage: 0.0194,
  },
  {
    Year: "2002",
    Percentage: 0.0218,
  },
  {
    Year: "2003",
    Percentage: 0.0208,
  },
  {
    Year: "2004",
    Percentage: 0.0209,
  },
  {
    Year: "2005",
    Percentage: 0.026,
  },
  {
    Year: "2006",
    Percentage: 0.0273,
  },
  {
    Year: "2007",
    Percentage: 0.0277,
  },
  {
    Year: "2008",
    Percentage: 0.0286,
  },
  {
    Year: "2009",
    Percentage: 0.0321,
  },
  {
    Year: "2010",
    Percentage: 0.0299,
  },
  {
    Year: "2011",
    Percentage: 0.0306,
  },
  {
    Year: "2012",
    Percentage: 0.0313,
  },
  {
    Year: "2013",
    Percentage: 0.0313,
  },
  {
    Year: "2014",
    Percentage: 0.034,
  },
  {
    Year: "2015",
    Percentage: 0.031,
  },
  {
    Year: "2016",
    Percentage: 0.027,
  },
  {
    Year: "2017",
    Percentage: 0.0287,
  },
  {
    Year: "2018",
    Percentage: 0.0277,
  },
  {
    Year: "2019",
    Percentage: 0.0286,
  },
  {
    Year: "2020",
    Percentage: 0.0305,
  },
  {
    Year: "2021",
    Percentage: 0.0166,
  },
  {
    Year: "2022",
    Percentage: 0.0253,
  },
  {
    Year: "2023",
    Percentage: 0.0327,
  },
  {
    Year: "2024",
    Percentage: 0.0271,
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
