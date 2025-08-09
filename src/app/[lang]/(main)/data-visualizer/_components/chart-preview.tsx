import React, { forwardRef } from "react";
import { LineChart as LineChartComponent } from "@/components/LineChart";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { H3 } from "@/components/Layout";

// Canada Spends brand colors - using CSS custom properties for consistency
const CANADA_COLORS = [
  "hsl(var(--chart-1))", // Primary brand color
  "hsl(var(--chart-2))", // Secondary
  "hsl(var(--chart-3))", // Tertiary
  "hsl(var(--chart-4))", // Quaternary
  "hsl(var(--chart-5))", // Quinary
  "#FF0000", // Canada red as fallback
  "#0066CC", // Canada blue as fallback
];

type ChartData = Record<string, unknown>;

type ChartPreviewProps = {
  chartType: string;
  title: string;
  data: ChartData[];
  xField?: string;
  yField?: string;
};

export const ChartPreview = forwardRef<HTMLDivElement, ChartPreviewProps>(
  ({ chartType, title, data, xField, yField }, ref) => {
    const hasValidData = data && data.length > 0;

    // Auto-detect fields if not provided
    let detectedXField = xField;
    let detectedYField = yField;

    if (hasValidData && (!xField || !yField)) {
      const fields = Object.keys(data[0]);
      const textFields = fields.filter((field) => {
        const sampleValue = data[0][field];
        return (
          isNaN(Number(sampleValue)) ||
          sampleValue === null ||
          sampleValue === ""
        );
      });
      const numericFields = fields.filter((field) => {
        const sampleValue = data[0][field];
        return (
          !isNaN(Number(sampleValue)) &&
          sampleValue !== null &&
          sampleValue !== ""
        );
      });

      // Auto-select first text field for x-axis and first numeric field for y-axis
      if (!detectedXField && textFields.length > 0)
        detectedXField = textFields[0];
      if (!detectedYField && numericFields.length > 0)
        detectedYField = numericFields[0];

      // Fallback: if no text fields, use first field for x-axis
      if (!detectedXField && fields.length > 0) detectedXField = fields[0];
      // Fallback: if no numeric fields, use second field for y-axis or first if only one field
      if (!detectedYField && fields.length > 1) detectedYField = fields[1];
      else if (!detectedYField && fields.length > 0) detectedYField = fields[0];
    }

    const hasRequiredFields =
      detectedXField &&
      detectedYField &&
      hasValidData &&
      data[0][detectedXField] !== undefined &&
      data[0][detectedYField] !== undefined;

    // Format numbers for display
    const formatValue = (value: unknown) => {
      const num = Number(value);
      if (isNaN(num)) return value;
      if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
      if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
      if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
      return num.toLocaleString();
    };

    const CustomTooltip = ({
      active,
      payload,
      label,
    }: {
      active?: boolean;
      payload?: Array<{ name: string; value: unknown; color: string }>;
      label?: string;
    }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900">{label}</p>
            {payload.map((entry, index: number) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {`${entry.name}: ${formatValue(entry.value)}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    if (!hasValidData) {
      return (
        <div
          ref={ref}
          className="flex items-center justify-center h-80 bg-gray-50 rounded border-2 border-dashed"
        >
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Data Available</div>
            <div className="text-sm">
              Please upload or paste data to create your chart
            </div>
          </div>
        </div>
      );
    }

    if (!hasRequiredFields) {
      return (
        <div
          ref={ref}
          className="flex items-center justify-center h-80 bg-gray-50 rounded border-2 border-dashed"
        >
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">
              Unable to Create Chart
            </div>
            <div className="text-sm">
              The data format is not suitable for visualization. Please ensure
              your data has at least one field with values.
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white">
        <div className="mb-4 text-center">
          <H3 className="text-gray-900">{title}</H3>
        </div>
        <div className="h-80 w-full">
          {chartType === "bar" && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey={detectedXField}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  tickFormatter={formatValue}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <CustomTooltip />
                <Bar
                  dataKey={detectedYField}
                  fill={CANADA_COLORS[0]}
                  radius={[4, 4, 0, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          )}

          {chartType === "horizontalBar" && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart
                data={data}
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  type="number"
                  tickFormatter={formatValue}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  type="category"
                  dataKey={detectedXField}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                  width={70}
                />
                <CustomTooltip />
                <Bar
                  dataKey={detectedYField}
                  fill={CANADA_COLORS[1]}
                  radius={[0, 4, 4, 0]}
                />
              </RechartsBarChart>
            </ResponsiveContainer>
          )}

          {chartType === "line" && (
            <LineChartComponent
              data={data}
              index={detectedXField}
              categories={[detectedYField]}
              showLegend={false}
              showGridLines={true}
            />
          )}

          {chartType === "area" && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey={detectedXField}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  tickFormatter={formatValue}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <CustomTooltip />
                <Area
                  type="monotone"
                  dataKey={detectedYField}
                  stroke={CANADA_COLORS[2]}
                  fill={CANADA_COLORS[2]}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartType === "pie" && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <CustomTooltip />
                <Pie
                  data={data}
                  dataKey={detectedYField}
                  nameKey={detectedXField}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CANADA_COLORS[index % CANADA_COLORS.length]}
                    />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          )}

          {chartType === "donut" && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <CustomTooltip />
                <Pie
                  data={data}
                  dataKey={detectedYField}
                  nameKey={detectedXField}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CANADA_COLORS[index % CANADA_COLORS.length]}
                    />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          )}

          {chartType === "scatter" && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsScatterChart
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey={detectedXField}
                  type="number"
                  name={detectedXField}
                  tickFormatter={formatValue}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <YAxis
                  dataKey={detectedYField}
                  type="number"
                  name={detectedYField}
                  tickFormatter={formatValue}
                  fontSize={12}
                  stroke="hsl(var(--foreground))"
                />
                <CustomTooltip />
                <Scatter data={data} fill={CANADA_COLORS[3]} />
              </RechartsScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  },
);

ChartPreview.displayName = "ChartPreview";
