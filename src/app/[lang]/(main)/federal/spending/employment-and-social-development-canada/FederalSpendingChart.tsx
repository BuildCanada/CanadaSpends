"use client";

import { LineChart } from "@/components/LineChart";

const chartdata = [
  {
    Year: "1995",
    Percentage: 0.2069,
  },
  {
    Year: "1996",
    Percentage: 0.2109,
  },
  {
    Year: "1997",
    Percentage: 0.1626,
  },
  {
    Year: "1998",
    Percentage: 0.1666,
  },
  {
    Year: "1999",
    Percentage: 0.1699,
  },
  {
    Year: "2000",
    Percentage: 0.1705,
  },
  {
    Year: "2001",
    Percentage: 0.1674,
  },
  {
    Year: "2002",
    Percentage: 0.1695,
  },
  {
    Year: "2003",
    Percentage: 0.1536,
  },
  {
    Year: "2004",
    Percentage: 0.1562,
  },
  {
    Year: "2005",
    Percentage: 0.1549,
  },
  {
    Year: "2006",
    Percentage: 0.1635,
  },
  {
    Year: "2007",
    Percentage: 0.1697,
  },
  {
    Year: "2008",
    Percentage: 0.1782,
  },
  {
    Year: "2009",
    Percentage: 0.175,
  },
  {
    Year: "2010",
    Percentage: 0.1636,
  },
  {
    Year: "2011",
    Percentage: 0.1822,
  },
  {
    Year: "2012",
    Percentage: 0.177,
  },
  {
    Year: "2013",
    Percentage: 0.1835,
  },
  {
    Year: "2014",
    Percentage: 0.1871,
  },
  {
    Year: "2015",
    Percentage: 0.1937,
  },
  {
    Year: "2016",
    Percentage: 0.208,
  },
  {
    Year: "2017",
    Percentage: 0.1911,
  },
  {
    Year: "2018",
    Percentage: 0.1824,
  },
  {
    Year: "2019",
    Percentage: 0.1828,
  },
  {
    Year: "2020",
    Percentage: 0.1986,
  },
  {
    Year: "2021",
    Percentage: 0.2675,
  },
  {
    Year: "2022",
    Percentage: 0.1942,
  },
  {
    Year: "2023",
    Percentage: 0.1862,
  },
  {
    Year: "2024",
    Percentage: 0.1838,
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
