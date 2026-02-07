"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "2006",
    Percentage: 0.0073,
  },
  {
    Year: "2007",
    Percentage: 0.0066,
  },
  {
    Year: "2008",
    Percentage: 0.0084,
  },
  {
    Year: "2009",
    Percentage: 0.0095,
  },
  {
    Year: "2010",
    Percentage: 0.0154,
  },
  {
    Year: "2011",
    Percentage: 0.0231,
  },
  {
    Year: "2012",
    Percentage: 0.0167,
  },
  {
    Year: "2013",
    Percentage: 0.0136,
  },
  {
    Year: "2014",
    Percentage: 0.0128,
  },
  {
    Year: "2015",
    Percentage: 0.0119,
  },
  {
    Year: "2016",
    Percentage: 0.0118,
  },
  {
    Year: "2017",
    Percentage: 0.0123,
  },
  {
    Year: "2018",
    Percentage: 0.0141,
  },
  {
    Year: "2019",
    Percentage: 0.0178,
  },
  {
    Year: "2020",
    Percentage: 0.0267,
  },
  {
    Year: "2021",
    Percentage: 0.0098,
  },
  {
    Year: "2022",
    Percentage: 0.0291,
  },
  {
    Year: "2023",
    Percentage: 0.0258,
  },
  {
    Year: "2024",
    Percentage: 0.0282,
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
