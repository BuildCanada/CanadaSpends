"use client";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  HitsPerPage,
  useInstantSearch,
  SortBy,
} from "react-instantsearch";
/* @ts-expect-error CSS doesn't export types */
import "./search.css"; // Make sure this path is correct
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { useMemo, useState, useCallback } from "react"; // Ensure useCallback and useState are imported
import { Share } from "lucide-react"; // Added Download and Share icons
import { cn } from "@/lib/utils"; // Adjust path if necessary
import { Button } from "@/components/button"; // Adjust path if necessary
import { H3 } from "@/components/Layout"; // Adjust path if necessary
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/dropdown-menu"; // Import Dropdown components
import { X, Linkedin, Facebook, Copy } from "lucide-react"; // Import specific icons
import { RefinementListCombobox } from "./RefinementListCombobox";
import { DownloadResultsButton } from "./DownloadResultsButton";
import { HitCard } from "./HitCard";
import { ResultsTable } from "./ResultsTable";
import { IndividualRefinementChips } from "./IndividualRefinementChips";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { useRouter } from "next/navigation";

// Define adapter, client, and index name outside components and export needed constants
const typesenseAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: "YpZamILESYThUVYZZ87dIBuJorHtRPfa",
    nodes: [
      { host: "search.canadasbuilding.com", port: 443, protocol: "https" },
    ],
    cacheSearchResultsForSeconds: 120,
  },
  additionalSearchParameters: {
    query_by: "recipient,program,description",
    query_by_weights: "4,2,1",
  },
});
export const searchClient = typesenseAdapter.searchClient;
export const mainIndexName = "records";

// --- SearchControls Component ---
function SearchControls() {
  const { results, indexUiState, setIndexUiState } = useInstantSearch();

  const hasFilters = useMemo(() => {
    const refinements = indexUiState.refinementList || {};
    const range = indexUiState.range || {};
    const toggle = indexUiState.toggle || {};
    return (
      Object.values(refinements).some((list) => list?.length > 0) ||
      Object.keys(range).length > 0 ||
      Object.keys(toggle).length > 0
    );
  }, [indexUiState]);

  const totalHits = results?.nbHits ?? 0;

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [copyStatus, setCopyStatus] = useState("Copy Link");
  const router = useRouter();

  const getCurrentUrl = () => window.location.href;

  const shareOnPlatform = (platform: "x" | "facebook" | "linkedin") => {
    const url = getCurrentUrl();
    let shareUrl = "";
    const text = encodeURIComponent(
      "Check out these Canadian government spending results:",
    );

    switch (platform) {
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }
    if (shareUrl) {
      console.log(`Attempting to open share URL for ${platform}:`, shareUrl);
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } else {
      console.error(`Could not generate share URL for platform: ${platform}`);
    }
  };

  const handleCopyLink = useCallback(() => {
    const url = getCurrentUrl();
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopyStatus("Copied!");
          setTimeout(() => setCopyStatus("Copy Link"), 2000); // Reset after 2 seconds
        })
        .catch((err) => {
          console.error("Failed to copy link: ", err);
          setCopyStatus("Error");
          setTimeout(() => setCopyStatus("Copy Link"), 2000);
        });
    } else {
      // Fallback for older browsers or insecure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopyStatus("Copied!");
        setTimeout(() => setCopyStatus("Copy Link"), 2000);
      } catch (err) {
        console.error("Fallback copy failed: ", err);
        setCopyStatus("Error copying");
        setTimeout(() => setCopyStatus("Copy Link"), 2000);
      }
    }
  }, []);

  // --- Sort Handler for Custom Select ---
  const handleSortChange = useCallback(
    (value: string) => {
      let instantSearchSortByValue: string | undefined;
      switch (value) {
        case "amount_desc":
          instantSearchSortByValue = `${mainIndexName}/sort/amount:desc`;
          break;
        case "amount_asc":
          instantSearchSortByValue = `${mainIndexName}/sort/amount:asc`;
          break;
        case "relevance":
        default:
          instantSearchSortByValue = mainIndexName;
          break;
      }
      console.log(
        `[handleSortChange] Select value: ${value}, Setting IS state sortBy: ${instantSearchSortByValue}`,
      );

      setIndexUiState((prevUiState) => ({
        ...prevUiState,
        page: 0,
        sortBy: instantSearchSortByValue,
      }));

      setTimeout(() => {
        const url = new URL(window.location.href);
        const urlParamValue = value === "relevance" ? undefined : value;
        if (urlParamValue) {
          url.searchParams.set("sort_by", urlParamValue);
        } else {
          url.searchParams.delete("sort_by");
        }
        console.log(
          `[handleSortChange] Pushing URL: ${url.pathname}${url.search}`,
        );
        router.push(url.pathname + url.search, { scroll: false });
      }, 50);
    },
    [setIndexUiState, router],
  );

  // --- Derive Value for Custom Select from IS State ---
  const currentSortValueForSelect = useMemo(() => {
    const currentSortByState = indexUiState.sortBy;
    if (currentSortByState === `${mainIndexName}/sort/amount:desc`) {
      return "amount_desc";
    } else if (currentSortByState === `${mainIndexName}/sort/amount:asc`) {
      return "amount_asc";
    } else {
      return "relevance";
    }
  }, [indexUiState.sortBy]);

  return (
    <>
      <div className="px-4">
        <SearchBox
          placeholder="Search federal spending…"
          classNames={{
            root: "mb-4 relative",
            form: "",
            input: "",
            submit: "",
            reset: "",
          }}
        />
      </div>
      <div className="w-full px-4 mt-2 pb-2 border-b border-charcoal">
        <div className="flex flex-wrap gap-2">
          {/* Your RefinementListCombobox instances */}
          <RefinementListCombobox
            attribute="payer"
            placeholder="Department"
            width="w-[145px]"
            sortBy={["name:asc"]}
          />
          <RefinementListCombobox
            attribute="fiscal_year"
            placeholder="Fiscal Year"
            width="w-[130px]"
            sortBy={["name:desc"]}
          />
          <RefinementListCombobox
            attribute="recipient"
            placeholder="Recipient"
            width="w-[125px]"
            sortBy={["name:asc"]}
          />
          <RefinementListCombobox
            attribute="province"
            placeholder="Province"
            width="w-[120px]"
          />
          <RefinementListCombobox
            attribute="country"
            placeholder="Country"
            width="w-[115px]"
            sortBy={["name:asc"]}
          />
          <RefinementListCombobox
            attribute="program"
            placeholder="Program"
            width="w-[208px]"
            sortBy={["name:asc"]}
          />
          <RefinementListCombobox
            attribute="award_type"
            placeholder="Type"
            width="w-[100px]"
            popoverWidth="w-[200px]"
            sortBy={["name:asc"]}
          />
        </div>
      </div>

      <IndividualRefinementChips />

      <div className="px-4">
        <div className="flex flex-col gap-2 mt-4">
          {indexUiState.query || hasFilters ? (
            <>
              {/* --- Results Header Area --- */}
              <div className="flex flex-wrap justify-between items-center mb-4 gap-y-2 border-b pb-4">
                {/* Left Side: Results Count */}
                <div className="flex items-center h-9">
                  <span className="text-lg font-semibold">
                    Results ({totalHits.toLocaleString()})
                  </span>
                </div>
                {/* Right Side: Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Use Custom Shadcn Select for Sort By */}
                  <div className="flex items-center mr-2">
                    <span className="text-sm text-foreground mr-2 shrink-0">
                      Order By:
                    </span>
                    <Select
                      value={currentSortValueForSelect}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger className="w-45 h-9 text-sm">
                        <SelectValue placeholder="Relevance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="amount_desc">
                          Amount (High to Low)
                        </SelectItem>
                        <SelectItem value="amount_asc">
                          Amount (Low to High)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Download Button */}
                  {totalHits > 0 && <DownloadResultsButton />}

                  {/* Share Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9">
                        <Share className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Share</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => shareOnPlatform("x")}>
                        <X className="mr-2 h-4 w-4" />
                        <span>Share on X</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => shareOnPlatform("facebook")}
                      >
                        <Facebook className="mr-2 h-4 w-4" />
                        <span>Share on Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => shareOnPlatform("linkedin")}
                      >
                        <Linkedin className="mr-2 h-4 w-4" />
                        <span>Share on LinkedIn</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink}>
                        <Copy className="mr-2 h-4 w-4" />
                        <span>{copyStatus}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Separator */}
                  <div className="border-l pl-2 ml-2 h-6 hidden sm:block"></div>
                  {/* View Toggle with fixed styling */}
                  <div className="flex rounded-md overflow-hidden border border-foreground">
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      className={cn(
                        "h-9 rounded-none",
                        viewMode === "table" && "bg-charcoal/30 text-charcoal",
                      )}
                      size="sm"
                      onClick={() => setViewMode("table")}
                    >
                      Table
                    </Button>
                    <Button
                      variant={viewMode === "cards" ? "secondary" : "ghost"}
                      className={cn(
                        "h-9 rounded-none",
                        viewMode === "cards" &&
                          "bg-foreground/30 text-foreground",
                      )}
                      size="sm"
                      onClick={() => setViewMode("cards")}
                    >
                      Cards
                    </Button>
                  </div>
                </div>
              </div>
              {/* --- End Results Header Area --- */}

              {totalHits === 0 && hasFilters && (
                <div className="text-center my-8 text-foreground">
                  <p>No results found matching your current filters.</p>
                </div>
              )}

              {/* --- Conditional View Rendering --- */}
              {viewMode === "table" ? (
                <ResultsTable />
              ) : (
                <Hits hitComponent={HitCard} />
              )}
              {/* --- End Conditional View --- */}

              {totalHits > 0 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Pagination
                    classNames={{
                      root: "flex list-none p-0",
                      list: "flex list-none p-0 items-center",
                      item: "mx-1",
                      link: "block px-3 py-1 border border-charcoal rounded-md hover:bg-linen text-charcoal",
                      selectedItem: "bg-primary text-background border-primary",
                      disabledItem: "opacity-50 cursor-not-allowed",
                      previousPageItem: "mr-2",
                      nextPageItem: "ml-2",
                    }}
                  />
                  <HitsPerPage
                    items={[
                      { label: "10 per page", value: 10 },
                      { label: "25 per page", value: 25, default: true },
                      { label: "50 per page", value: 50 },
                      { label: "100 per page", value: 100 },
                    ]}
                    classNames={{
                      root: "flex items-center",
                      select:
                        "h-9 px-3 py-1 border border-charcoal rounded-md bg-background text-charcoal text-sm cursor-pointer hover:bg-linen",
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            // Initial state message (Your existing code)
            <div className="flex justify-center text-center mt-8">
              <H3>
                Not sure where to start? Try searching for:
                <br />{" "}
                <a
                  className="underline link"
                  href="?records%5Bquery%5D=Management%20Consulting&records%5BrefinementList%5D%5Bfiscal_year%5D%5B0%5D=2024-2025&records%5BrefinementList%5D%5Bfiscal_year%5D%5B1%5D=2020-2021&records%5BrefinementList%5D%5Bfiscal_year%5D%5B2%5D=2023-2024&records%5BrefinementList%5D%5Bfiscal_year%5D%5B3%5D=2021-2022&records%5BrefinementList%5D%5Bfiscal_year%5D%5B4%5D=2022-2023"
                >
                  &apos;Management Consulting&apos; since 2020
                </a>{" "}
                or{" "}
                <a href="?records%5Bquery%5D=Wine" className="underline link">
                  &apos;Wine&apos;
                </a>
              </H3>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// --- Main Search Component ---
export default function Search() {
  // Define items for the *hidden* SortBy widget
  const sortItems = [
    { label: "Relevance", value: mainIndexName }, // Maps to 'relevance' in custom select
    {
      label: "Amount (High to Low)",
      value: `${mainIndexName}/sort/amount:desc`,
    }, // Maps to 'amount_desc'
    {
      label: "Amount (Low to High)",
      value: `${mainIndexName}/sort/amount:asc`,
    }, // Maps to 'amount_asc'
  ];

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={mainIndexName}
      routing={true}
      future={{
        preserveSharedStateOnUnmount: true,
      }}
    >
      {/* Re-add hidden SortBy for state consistency */}
      <div style={{ display: "none" }}>
        <SortBy items={sortItems} />
      </div>
      <SearchControls />
    </InstantSearch>
  );
}
