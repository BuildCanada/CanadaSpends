import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";

interface FieldMappingProps {
  data: Record<string, unknown>[];
  chartType: string;
  xField: string;
  yField: string;
  onXFieldChange: (field: string) => void;
  onYFieldChange: (field: string) => void;
}

export function FieldMapping({
  data,
  chartType,
  xField,
  yField,
  onXFieldChange,
  onYFieldChange,
}: FieldMappingProps) {
  if (!data || data.length === 0) return null;

  const fields = Object.keys(data[0]);
  const numericFields = fields.filter((field) => {
    const sampleValue = data[0][field];
    return (
      !isNaN(Number(sampleValue)) && sampleValue !== null && sampleValue !== ""
    );
  });
  const textFields = fields.filter((field) => {
    const sampleValue = data[0][field];
    return (
      isNaN(Number(sampleValue)) || sampleValue === null || sampleValue === ""
    );
  });

  const getFieldLabel = (chartType: string, fieldType: "x" | "y") => {
    if (chartType === "pie") {
      return fieldType === "x" ? "Label Field" : "Value Field";
    }
    if (chartType === "scatter") {
      return fieldType === "x" ? "X Axis (Numeric)" : "Y Axis (Numeric)";
    }
    return fieldType === "x" ? "Category Field" : "Value Field (Numeric)";
  };

  const getRecommendedFields = (chartType: string, fieldType: "x" | "y") => {
    if (chartType === "pie") {
      return fieldType === "x" ? textFields : numericFields;
    }
    if (chartType === "scatter") {
      return numericFields;
    }
    return fieldType === "x" ? textFields : numericFields;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Field Mapping</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <Label className="text-sm font-medium">
            {getFieldLabel(chartType, "x")}
          </Label>
          <Select value={xField} onValueChange={onXFieldChange}>
            <SelectTrigger className="bg-background mt-1">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {getRecommendedFields(chartType, "x").map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
              {getRecommendedFields(chartType, "x").length > 0 &&
                fields.length > getRecommendedFields(chartType, "x").length && (
                  <div className="border-t my-1" />
                )}
              {fields
                .filter(
                  (f) => !getRecommendedFields(chartType, "x").includes(f),
                )
                .map((field) => (
                  <SelectItem
                    key={field}
                    value={field}
                    className="text-gray-500"
                  >
                    {field}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">
            {getFieldLabel(chartType, "y")}
          </Label>
          <Select value={yField} onValueChange={onYFieldChange}>
            <SelectTrigger className="bg-background mt-1">
              <SelectValue placeholder="Select field..." />
            </SelectTrigger>
            <SelectContent>
              {getRecommendedFields(chartType, "y").map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
              {getRecommendedFields(chartType, "y").length > 0 &&
                fields.length > getRecommendedFields(chartType, "y").length && (
                  <div className="border-t my-1" />
                )}
              {fields
                .filter(
                  (f) => !getRecommendedFields(chartType, "y").includes(f),
                )
                .map((field) => (
                  <SelectItem
                    key={field}
                    value={field}
                    className="text-gray-500"
                  >
                    {field}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 lg:col-span-1 flex items-end">
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded w-full">
            <strong>Data Preview:</strong>
            <br />
            {data.length} rows with {fields.length} fields
            <br />
            <span className="text-gray-500">
              {fields.slice(0, 3).join(", ")}
              {fields.length > 3 ? "..." : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
