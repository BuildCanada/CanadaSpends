"use client";

import { H1, PageContent, Section } from "@/components/Layout";
import { Button } from "@/components/button";
import React, { useState, useRef } from "react";
import { ChartDataField, ChartTypeField, ChartPreview } from "./_components";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseCSV } from "@/utils/csvUtils";
import { Download, Share2, FileImage, FileText } from "lucide-react";
import { sanitizeFilename } from "@/utils/chartDownload";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export default function DataVisualizerPage() {
  const [title, setTitle] = useState("My Chart");
  const [chartType, setChartType] = useState("bar");
  const [dataText, setDataText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dataTab, setDataTab] = useState("upload");

  const handleDataTabChange = (newTab: string) => {
    // Reset everything when changing data input method
    setDataTab(newTab);
    setFile(null);
    setDataText("");
    setParsedData([]);
    setIsDataParsed(false);
    setParseError("");
  };

  const handleDataTextChange = (text: string) => {
    setDataText(text);
    // Auto-reset chart preview when paste data input is cleared
    if (text.trim() === "") {
      setParsedData([]);
      setIsDataParsed(false);
      setParseError("");
    }
  };
  const [isDownloading, setIsDownloading] = useState(false);
  const [parsedData, setParsedData] = useState<Record<string, unknown>[]>([]);
  const [isDataParsed, setIsDataParsed] = useState(false);
  const [parseError, setParseError] = useState<string>("");
  const chartRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setIsDataParsed(false);
      setParseError("");
    }
  };

  const handleVisualizeData = async () => {
    setParseError("");
    setParsedData([]);
    setIsDataParsed(false);

    try {
      let dataToProcess = "";

      if (dataTab === "upload" && file) {
        // Handle file upload
        const fileContent = await file.text();
        dataToProcess = fileContent;
      } else if (dataTab === "paste" && dataText.trim()) {
        // Handle pasted data
        dataToProcess = dataText.trim();
      } else {
        setParseError(
          "Please provide data by uploading a file or pasting CSV/JSON content.",
        );
        return;
      }

      // Validate file size (10MB limit)
      if (file && file.size > 10 * 1024 * 1024) {
        throw new Error(
          "File size too large. Please use files smaller than 10MB.",
        );
      }

      // Try to parse as JSON first, then CSV
      let parsed: Record<string, unknown>[] = [];

      if (
        dataToProcess.trim().startsWith("[") ||
        dataToProcess.trim().startsWith("{")
      ) {
        // Looks like JSON
        try {
          const jsonData = JSON.parse(dataToProcess);
          if (Array.isArray(jsonData)) {
            parsed = jsonData;
          } else if (typeof jsonData === "object" && jsonData !== null) {
            // Check for Chart.js format (labels + datasets)
            if (
              jsonData.labels &&
              Array.isArray(jsonData.labels) &&
              jsonData.datasets &&
              Array.isArray(jsonData.datasets)
            ) {
              const labels = jsonData.labels;
              const dataset = jsonData.datasets[0]; // Use first dataset
              if (dataset && dataset.data && Array.isArray(dataset.data)) {
                // Convert Chart.js format to flat array
                parsed = labels.map((label: unknown, index: number) => ({
                  label: label,
                  value: dataset.data[index],
                }));
                console.log("Converted Chart.js format to:", parsed);
              } else {
                throw new Error(
                  "Invalid Chart.js format: dataset must have data array",
                );
              }
            } else {
              // Check if the object contains arrays that could be chart data
              const arrayValues = Object.values(jsonData).filter((value) =>
                Array.isArray(value),
              );
              if (arrayValues.length > 0) {
                // Use the first array found (most common case)
                parsed = arrayValues[0] as Record<string, unknown>[];
              } else {
                // Single object, wrap in array
                parsed = [jsonData];
              }
            }
          } else {
            throw new Error("JSON must be an object or array");
          }
        } catch (jsonError) {
          throw new Error(
            `Invalid JSON format: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`,
          );
        }
      } else {
        // Try as CSV
        try {
          parsed = parseCSV(dataToProcess);
        } catch (csvError) {
          throw new Error(
            `Invalid CSV format: ${csvError instanceof Error ? csvError.message : "Unknown error"}`,
          );
        }
      }

      if (parsed.length === 0) {
        throw new Error("No data rows found in the provided content");
      }

      if (parsed.length > 10000) {
        console.warn(
          `Large dataset detected: ${parsed.length} rows. Performance may be affected.`,
        );
      }

      // Validate that we have at least one field
      if (parsed.length > 0 && Object.keys(parsed[0]).length === 0) {
        throw new Error(
          "No data fields found. Please ensure your data has column headers.",
        );
      }

      setParsedData(parsed);
      setIsDataParsed(true);

      console.log("Data parsed successfully:", parsed.length, "rows");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown parsing error";
      setParseError(`Failed to parse data: ${errorMessage}`);
      console.error("Parse error:", error);
    }
  };

  const handleDownloadChart = async (format: "png" | "svg" = "png") => {
    if (!chartRef.current) {
      alert(
        "Chart not available for download. Please wait for the chart to load.",
      );
      return;
    }

    setIsDownloading(true);

    try {
      const filename = sanitizeFilename(title) || "chart";

      if (format === "svg") {
        // SVG export
        const svgElement = chartRef.current.querySelector("svg");
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          throw new Error("No SVG element found in chart");
        }
      } else {
        // Simplified PNG export - use browser's built-in screenshot capability
        const svgElement = chartRef.current.querySelector("svg");
        if (svgElement) {
          // Get SVG dimensions
          const svgRect = svgElement.getBoundingClientRect();
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          if (!ctx) throw new Error("Could not create canvas context");

          // Set canvas size
          canvas.width = svgRect.width;
          canvas.height = svgRect.height;

          // Fill with white background
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Convert SVG to data URL and draw on canvas
          const svgData = new XMLSerializer().serializeToString(svgElement);
          const svgDataUrl = "data:image/svg+xml;base64," + btoa(svgData);

          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Download
            const link = document.createElement("a");
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsDownloading(false);
          };

          img.onerror = () => {
            throw new Error("Failed to load SVG for conversion");
          };

          img.src = svgDataUrl;
          return; // Exit early since we handle the download in the onload
        } else {
          throw new Error("No SVG element found in chart");
        }
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download chart. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadChartForSharing = async (): Promise<boolean> => {
    if (!chartRef.current) return false;

    try {
      const svgElement = chartRef.current.querySelector("svg");
      if (svgElement) {
        const svgRect = svgElement.getBoundingClientRect();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return false;

        canvas.width = svgRect.width;
        canvas.height = svgRect.height;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgDataUrl = "data:image/svg+xml;base64," + btoa(svgData);

        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);

            // Download the image
            const link = document.createElement("a");
            const filename = `${sanitizeFilename(title)}-chart.png`;
            link.download = filename;
            link.href = canvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            resolve(true);
          };

          img.onerror = () => resolve(false);
          img.src = svgDataUrl;
        });
      }
      return false;
    } catch (error) {
      console.error("Error generating chart image:", error);
      return false;
    }
  };

  const handleShareChart = async (platform: "twitter" | "linkedin") => {
    // Use production URL instead of local development URL
    const productionUrl = `https://canadaspends.com/en/data-visualizer`;
    const text = `Check out this chart: ${title} - Created with Canada Spends Data Visualizer`;

    try {
      // Download chart image first
      const imageDownloaded = await downloadChartForSharing();

      if (platform === "twitter") {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productionUrl)}`;
        window.open(twitterUrl, "_blank");

        if (imageDownloaded) {
          setTimeout(() => {
            alert(
              "Chart image downloaded! You can now attach it to your X post for better engagement.",
            );
          }, 1000);
        }
      } else if (platform === "linkedin") {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productionUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`;
        window.open(linkedinUrl, "_blank");

        if (imageDownloaded) {
          setTimeout(() => {
            alert(
              "Chart image downloaded! You can now attach it to your LinkedIn post for better engagement.",
            );
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Share failed:", error);
      alert("Failed to share. Please try again.");
    }
  };

  return (
    <PageContent>
      <Section>
        <div className="text-center mb-8">
          <H1>Data Visualizer</H1>
          <p className="text-lg text-gray-600 mt-4 max-w-3xl mx-auto">
            Create your own charts and graphs to visualize government data.
            Share and embed them on to your website, blog, or social media.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left section: Configuration Panel */}
          <div className="xl:col-span-4">
            <div className="bg-accent/50 p-6 rounded shadow-sm sticky top-4">
              <h2 className="text-xl font-semibold mb-6">Configuration</h2>

              {/* Chart Title */}
              <div className="flex flex-col gap-2 mb-6">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  type="text"
                  className="bg-background"
                  placeholder="Enter chart title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Chart Type */}
              <div className="flex flex-col gap-2 mb-6">
                <ChartTypeField
                  chartType={chartType}
                  setChartType={setChartType}
                />
              </div>

              {/* Data Input */}
              <div className="mb-6">
                <ChartDataField
                  dataTab={dataTab}
                  setDataTab={handleDataTabChange}
                  dataText={dataText}
                  setDataText={handleDataTextChange}
                  file={file}
                  handleFileChange={handleFileChange}
                />
              </div>

              {/* Parse Button */}
              <div className="mb-6">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVisualizeData}
                  disabled={!file && !dataText.trim()}
                >
                  Visualize
                </Button>
              </div>

              {/* Status Messages */}
              {(parseError || isDataParsed) && (
                <div className="mb-6">
                  {parseError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-2">
                      {parseError}
                    </div>
                  )}

                  {isDataParsed && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700 mb-4">
                      ✅ Successfully parsed {parsedData.length} rows of data
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right section: Chart Preview */}
          <div className="xl:col-span-8">
            <div className="bg-white p-6 rounded shadow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Chart Preview</h2>
                <div className="flex gap-2">
                  {/* Download Dropdown */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Download chart"
                        disabled={isDownloading || !isDataParsed}
                      >
                        <Download
                          className={`w-5 h-5 ${isDownloading ? "animate-spin" : ""}`}
                        />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[140px] z-[200]"
                        sideOffset={4}
                      >
                        <DropdownMenu.Item
                          className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
                          onClick={() => handleDownloadChart("png")}
                        >
                          <FileImage className="w-4 h-4" />
                          Download PNG
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer flex items-center gap-2"
                          onClick={() => handleDownloadChart("svg")}
                        >
                          <FileText className="w-4 h-4" />
                          Download SVG
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>

                  {/* Share Dropdown */}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Share chart"
                        disabled={!isDataParsed}
                      >
                        <Share2 className="w-5 h-5" />
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="bg-white rounded-md shadow-lg p-1 flex flex-col min-w-[140px] z-[200]"
                        sideOffset={4}
                      >
                        <DropdownMenu.Item
                          className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => handleShareChart("twitter")}
                        >
                          Share on X
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          className="px-3 py-2 text-sm hover:bg-gray-100 rounded cursor-pointer"
                          onClick={() => handleShareChart("linkedin")}
                        >
                          Share on LinkedIn
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </div>
              </div>

              {/* Chart takes full width and good height */}
              <div className="min-h-[500px]">
                <ChartPreview
                  ref={chartRef}
                  chartType={chartType}
                  title={title}
                  data={parsedData}
                />
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageContent>
  );
}
