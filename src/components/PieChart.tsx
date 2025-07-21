import { ResponsivePie } from "@nivo/pie";

/**
 * Interface representing a single data point for the pie chart.
 */
export interface PieChartDataObject {
  /** Unique identifier for the slice (used internally and in legends) */
  id: string;

  /** Human-readable label for the slice */
  label: string;

  /** Numerical value representing the size of the slice */
  value: number;

  /** Optional color in HSL or any valid CSS color format */
  color?: string;
}

/**
 * Props for the MyPie component.
 */
export interface PieChartDataArray {
  /** Array of pie data objects to render in the chart */
  data: PieChartDataObject[];
}

/**
 * A responsive Pie chart component using Nivo's `ResponsivePie`.
 *
 * Example:
 * ```tsx
 * const pieData: PieDatum[] = [
 *   { id: 'css', label: 'css', value: 579, color: 'hsl(338, 70%, 50%)' },
 *   { id: 'javascript', label: 'javascript', value: 175, color: 'hsl(142, 70%, 50%)' },
 *   { id: 'go', label: 'go', value: 266, color: 'hsl(288, 70%, 50%)' },
 *   { id: 'stylus', label: 'stylus', value: 322, color: 'hsl(10, 70%, 50%)' },
 *   { id: 'sass', label: 'sass', value: 518, color: 'hsl(350, 70%, 50%)' }
 * ]
 *
 * <MyPie data={pieData} />
 * ```
 */
const PieChart = ({ data }: PieChartDataArray) => {
  return (
    <ResponsivePie
      data={data}
      margin={{ top: 40, right: 80, bottom: 40, left: 120 }}
      innerRadius={0.5}
      padAngle={0.6}
      cornerRadius={2}
      activeOuterRadiusOffset={8}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#333333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: "color" }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor="#222"
      valueFormat={(v) => {
        if (typeof v === "object" && v !== null) {
          const obj = v as { label?: string };
          if (obj.label) return obj.label;
        }
        if (typeof v === "number") {
          return v.toFixed(1);
        }
        return String(v);
      }}
      arcLabel="arcLabel"
      legends={[
        {
          anchor: "left",
          direction: "column",
          justify: false,
          translateX: -100,
          translateY: 0,
          itemWidth: 120,
          itemHeight: 24,
          itemsSpacing: 4,
          symbolSize: 18,
          effects: [
            {
              on: "hover",
              style: {
                itemTextColor: "#000",
              },
            },
          ],
        },
      ]}
    />
  );
};

export default PieChart;
