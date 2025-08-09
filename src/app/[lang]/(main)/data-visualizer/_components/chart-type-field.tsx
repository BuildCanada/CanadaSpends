import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { Label } from "@/components/ui/label";

const chartTypes = [
  { label: "Bar Chart", value: "bar", icon: BarChart },
  { label: "Horizontal Bar", value: "horizontalBar", icon: BarChart3 },
  { label: "Line Chart", value: "line", icon: LineChart },
  { label: "Area Chart", value: "area", icon: TrendingUp },
  { label: "Pie Chart", value: "pie", icon: PieChart },
  { label: "Donut Chart", value: "donut", icon: PieChart },
  { label: "Scatter Plot", value: "scatter", icon: ScatterChart },
];

export function ChartTypeField({
  chartType,
  setChartType,
}: {
  chartType: string;
  setChartType: (chartType: string) => void;
}) {
  const selectedChart = chartTypes.find((type) => type.value === chartType);

  return (
    <div className="flex flex-col gap-2">
      <Label>Chart Type</Label>
      <Select value={chartType} onValueChange={setChartType}>
        <SelectTrigger className="bg-background">
          <SelectValue>
            {selectedChart && (
              <div className="flex items-center gap-2">
                <selectedChart.icon className="w-4 h-4" />
                {selectedChart.label}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {chartTypes.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {type.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
