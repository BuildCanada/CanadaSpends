"use client";

import { useState, useMemo, useCallback } from "react";
import { useInstantSearch } from "react-instantsearch";
import { Button } from "@/components/button";
import { Download } from "lucide-react";
import { SearchResult } from "../types/search";
import { convertResultsToCsv } from "../utils/csvUtils";
import { toast } from "sonner";

// REMOVE Comment block discussing import strategies
// import { searchClient, mainIndexName } from './Search'; // Defined and exported in Search.tsx
// Assuming these are correctly exported from where they are defined
import { searchClient, mainIndexName } from "./Search";

const MAX_DOWNLOAD_ROWS = 1000;
const BATCH_SIZE = 250;

// --- DownloadResultsButton Component ---
export function DownloadResultsButton() {
  const { results, indexUiState } = useInstantSearch();
  const [isDownloading, setIsDownloading] = useState(false);
  const totalHits = results?.nbHits ?? 0;
  const [downloadedCount, setDownloadedCount] = useState(0);
  const hitsToFetchTotal = useMemo(
    () => Math.min(totalHits, MAX_DOWNLOAD_ROWS),
    [totalHits],
  );

  const handleDownload = useCallback(async () => {
    if (totalHits > MAX_DOWNLOAD_ROWS) {
      toast.warning(
        `Downloads limited to ${MAX_DOWNLOAD_ROWS.toLocaleString()} results.`,
        {
          description:
            "Please apply additional filters to reduce the result set.",
        },
      );
      return;
    }
    if (hitsToFetchTotal === 0) return;

    setIsDownloading(true);
    setDownloadedCount(0);
    let allDownloadedHits: SearchResult[] = [];
    let currentPage = 0;

    try {
      const currentQuery = indexUiState.query ?? "";
      let currentSortBy = indexUiState.sortBy;

      // Handle InstantSearch sortBy format (e.g., "indexName/sort/field:order")
      if (currentSortBy?.includes("/")) {
        currentSortBy = currentSortBy.split("/sort/")[1];
      } else if (
        currentSortBy === mainIndexName ||
        currentSortBy === "relevance"
      ) {
        // Treat index name or 'relevance' as no specific sort for the API call
        currentSortBy = undefined;
      }

      const facetFilters: Array<string | string[]> = [];
      const refinementList = indexUiState.refinementList || {};
      Object.entries(refinementList).forEach(([attribute, values]) => {
        if (values && values.length > 0) {
          const filtersForAttribute = values.map((v) => `${attribute}:${v}`);
          if (filtersForAttribute.length === 1) {
            facetFilters.push(filtersForAttribute[0]);
          } else if (filtersForAttribute.length > 1) {
            facetFilters.push(filtersForAttribute);
          }
        }
      });

      // --- Pagination Loop ---
      while (allDownloadedHits.length < hitsToFetchTotal) {
        const pageToFetch = currentPage;
        setDownloadedCount(allDownloadedHits.length); // Update count for UI feedback

        const searchParams = {
          query: currentQuery,
          hitsPerPage: BATCH_SIZE,
          page: pageToFetch,
          facetFilters: facetFilters,
          facets: ["*"], // Keep fetching facets for consistency? Or omit?
          sort_by: currentSortBy,
          query_by: "recipient,program,description", // Match main search query_by
          query_by_weights: "4,2,1",
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const searchResponse: any = await searchClient.search([
          { indexName: mainIndexName, params: searchParams },
        ]);
        const hitsFromPage =
          (searchResponse.results?.[0]?.hits as SearchResult[]) ?? [];

        if (hitsFromPage.length === 0) {
          // REMOVE informational log: console.log(`No more hits found on page ${pageToFetch}. Stopping fetch loop.`);
          break;
        }

        allDownloadedHits = allDownloadedHits.concat(hitsFromPage);
        currentPage++;

        // Safety break
        if (currentPage > MAX_DOWNLOAD_ROWS / BATCH_SIZE + 2) {
          console.warn(
            "Pagination loop ran unexpectedly long, breaking for safety.",
          );
          break;
        }
      }
      // --- End Pagination Loop ---

      setDownloadedCount(allDownloadedHits.length);

      if (allDownloadedHits.length === 0) {
        console.warn("No hits found in the search response for download.");
        setIsDownloading(false);
        return;
      }

      const csvData = convertResultsToCsv(allDownloadedHits);
      if (!csvData) {
        console.warn("CSV data is empty after converting hits.");
        setIsDownloading(false);
        return;
      } else {
        // Trigger download
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        const date = new Date().toISOString().split("T")[0];
        link.setAttribute("download", `search-results-${date}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error during paginated download:", error);
      toast.error("Download Failed", {
        description:
          "An error occurred during download. Please check the console for details.",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [indexUiState, totalHits, hitsToFetchTotal]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isDownloading || totalHits === 0}
      className="h-9"
    >
      <Download className="mr-2 h-4 w-4" />
      {isDownloading
        ? `Downloading ${downloadedCount}/${hitsToFetchTotal}...`
        : "Download Results"}
    </Button>
  );
}
