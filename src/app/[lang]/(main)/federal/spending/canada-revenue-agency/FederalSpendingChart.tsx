"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.0142,
  },
  {
    Year: "1996",
    Percentage: 0.0139,
  },
  {
    Year: "1997",
    Percentage: 0.0149,
  },
  {
    Year: "1998",
    Percentage: 0.0163,
  },
  {
    Year: "1999",
    Percentage: 0.018,
  },
  {
    Year: "2000",
    Percentage: 0.0191,
  },
  {
    Year: "2001",
    Percentage: 0.0282,
  },
  {
    Year: "2002",
    Percentage: 0.0209,
  },
  {
    Year: "2003",
    Percentage: 0.0209,
  },
  {
    Year: "2004",
    Percentage: 0.021,
  },
  {
    Year: "2005",
    Percentage: 0.0155,
  },
  {
    Year: "2006",
    Percentage: 0.0177,
  },
  {
    Year: "2007",
    Percentage: 0.0153,
  },
  {
    Year: "2008",
    Percentage: 0.019,
  },
  {
    Year: "2009",
    Percentage: 0.0176,
  },
  {
    Year: "2010",
    Percentage: 0.0161,
  },
  {
    Year: "2011",
    Percentage: 0.0163,
  },
  {
    Year: "2012",
    Percentage: 0.016,
  },
  {
    Year: "2013",
    Percentage: 0.0157,
  },
  {
    Year: "2014",
    Percentage: 0.0147,
  },
  {
    Year: "2015",
    Percentage: 0.0145,
  },
  {
    Year: "2016",
    Percentage: 0.014,
  },
  {
    Year: "2017",
    Percentage: 0.0141,
  },
  {
    Year: "2018",
    Percentage: 0.0142,
  },
  {
    Year: "2019",
    Percentage: 0.0148,
  },
  {
    Year: "2020",
    Percentage: 0.0198,
  },
  {
    Year: "2021",
    Percentage: 0.0159,
  },
  {
    Year: "2022",
    Percentage: 0.0192,
  },
  {
    Year: "2023",
    Percentage: 0.0277,
  },
  {
    Year: "2024",
    Percentage: 0.0327,
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
