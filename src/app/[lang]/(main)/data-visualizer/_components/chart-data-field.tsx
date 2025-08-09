import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChartDataFieldProps {
  dataTab: string;
  setDataTab: (tab: string) => void;
  dataText: string;
  setDataText: (text: string) => void;
  file: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ChartDataField({
  dataTab,
  setDataTab,
  dataText,
  setDataText,
  file,
  handleFileChange,
}: ChartDataFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="data-method">Data Input Method</Label>
      <select
        id="data-method"
        value={dataTab}
        onChange={(e) => setDataTab(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="upload">Upload File</option>
        <option value="paste">Paste Data</option>
      </select>

      {dataTab === "upload" && (
        <div className="mt-2">
          <Label htmlFor="data-file" className="mb-2">
            Upload CSV or JSON
          </Label>
          <Input
            id="data-file"
            type="file"
            accept=".csv,.json,application/json,text/csv"
            className="bg-background"
            onChange={handleFileChange}
          />
          {file && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
              📁 Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>
      )}

      {dataTab === "paste" && (
        <div className="mt-2">
          <Label htmlFor="data-text" className="mb-2">
            Paste Data (CSV or JSON)
          </Label>
          <Textarea
            id="data-text"
            placeholder="Paste CSV or JSON data here"
            className="bg-background h-24 resize-none"
            value={dataText}
            onChange={(e) => setDataText(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
