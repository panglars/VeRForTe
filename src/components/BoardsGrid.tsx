// BoardsGrid.tsx
import React, { useState, useEffect } from "react";
import SortDropdown from "./SortDropdown";
import { getRelativeLocaleUrl } from "astro:i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";
import { ui, defaultLang } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";

interface BoardMetaData {
  product: string;
  cpu: string;
  cpu_core: string;
  ram: string;
  vendor: string;
  dir: string;
  [key: string]: string;
}

interface Props {
  boards: BoardMetaData[];
  lang: keyof typeof ui;
}

// Sort types
type SortField = "vendor" | "product";
type SortDirection = "asc" | "desc";

interface SortOption {
  id: string;
  label: string;
  field: SortField;
  direction: SortDirection;
  sortFn?: (a: BoardMetaData, b: BoardMetaData) => number;
}

const BoardsGrid: React.FC<Props> = ({ boards: initialBoards, lang }) => {
  // Get translation function directly in the component
  const t = useTranslations(lang);

  // Define sort options with custom sort functions
  const sortOptions: SortOption[] = [
    {
      id: "vendor-asc",
      label: t("sort.ruyi"),
      field: "vendor",
      direction: "asc",
      // Custom sort function for Ruyisdk Support
      sortFn: (a, b) => {
        // Check if vendor exists
        const hasVendorA = a.vendor && a.vendor.trim() !== "";
        const hasVendorB = b.vendor && b.vendor.trim() !== "";

        // If both have or both don't have vendor, sort by product alphabetically
        if (hasVendorA === hasVendorB) {
          return a.product.localeCompare(b.product);
        }

        // If only one has vendor, it comes first
        return hasVendorA ? -1 : 1;
      },
    },
    {
      id: "product-asc",
      label: t("sort.asc"),
      field: "product",
      direction: "asc",
      sortFn: (a, b) => a.product.localeCompare(b.product),
    },
    {
      id: "product-desc",
      label: t("sort.desc"),
      field: "product",
      direction: "desc",
      sortFn: (a, b) => b.product.localeCompare(a.product),
    },
  ];

  // State for search and sort
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentSort, setCurrentSort] = useState<SortOption>(sortOptions[0]);
  const [visibleBoards, setVisibleBoards] = useState<BoardMetaData[]>([]);
  const [hasResults, setHasResults] = useState<boolean>(true);

  // Apply initial sort on component mount
  useEffect(() => {
    sortBoards(initialBoards, currentSort);
  }, [initialBoards]);

  // Function to sort boards
  const sortBoards = (boards: BoardMetaData[], sortOption: SortOption) => {
    if (!boards.length) {
      setVisibleBoards([]);
      setHasResults(false);
      return;
    }

    let sortedBoards: BoardMetaData[];

    if (sortOption.sortFn) {
      // Use custom sort function if provided
      sortedBoards = [...boards].sort(sortOption.sortFn);
    } else {
      // Use default sort logic
      sortedBoards = [...boards].sort((a, b) => {
        const valueA = a[sortOption.field] || "";
        const valueB = b[sortOption.field] || "";

        return sortOption.direction === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      });
    }

    setVisibleBoards(sortedBoards);
    setHasResults(sortedBoards.length > 0);
  };

  // Handle search change
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchQuery = e.target.value;
    setSearchQuery(searchQuery);

    const normalizedQuery = searchQuery.toLowerCase().trim();

    if (!normalizedQuery) {
      // If search is empty, show all boards with current sort
      sortBoards(initialBoards, currentSort);
      return;
    }

    // Filter boards based on search query
    const filteredBoards = initialBoards.filter((board) => {
      const product = board.product.toLowerCase();
      const cpu = board.cpu.toLowerCase();
      const cpuCore = board.cpu_core.toLowerCase();

      return [product, cpu, cpuCore].some((attr) =>
        attr.includes(normalizedQuery),
      );
    });

    // Sort filtered boards
    sortBoards(filteredBoards, currentSort);
  };

  // Handle sort change
  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSort(sortOption);

    // Apply new sort to current visible boards based on current search
    const boardsToSort = searchQuery.trim()
      ? initialBoards.filter((board) => {
          const normalizedQuery = searchQuery.toLowerCase().trim();
          const product = board.product.toLowerCase();
          const cpu = board.cpu.toLowerCase();
          const cpuCore = board.cpu_core.toLowerCase();

          return [product, cpu, cpuCore].some((attr) =>
            attr.includes(normalizedQuery),
          );
        })
      : initialBoards;

    sortBoards(boardsToSort, sortOption);
  };

  return (
    <div>
      {/* Search Bar - Styled like the original SearchBar component */}
      <div className="max-w-xl w-full mx-auto md:my-16 my-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t("search_placeholder") || "Search boards..."}
            className="pl-12 py-6 w-full text-lg rounded-md border border-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            aria-label="Search boards"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end mb-6">
        <SortDropdown
          options={sortOptions}
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      </div>

      {/* No Results Message */}
      {!hasResults && (
        <div className="text-center p-8 border rounded-lg mt-8">
          <p className="text-muted-foreground">
            {t("no_board_results") ||
              "No boards found matching your search criteria."}
          </p>
        </div>
      )}

      {/* Boards Grid */}
      {hasResults && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleBoards.map((board, index) => (
            <div key={`${board.dir}-${index}`} className="board-card">
              <a
                href={getRelativeLocaleUrl(lang, `board/${board.dir}`, {
                  normalizeLocale: false,
                })}
              >
                <Card className="h-full transition-transform duration-200 hover:bg-muted hover:shadow-lg hover:translate-y-[-0.25rem]">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {board.product}
                    </CardTitle>
                    <CardDescription />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-muted-foreground">
                      <div className="grid grid-cols-4">
                        <span className="text-sm">{t("cpu")}</span>
                        <span className="text-right font-medium col-span-3 text-secondary-foreground">
                          {board.cpu}
                        </span>
                      </div>
                      <div className="grid grid-cols-4">
                        <span className="text-sm">{t("ram")}</span>
                        <span className="text-right font-medium col-span-3 text-secondary-foreground">
                          {board.ram}
                        </span>
                      </div>
                      <div className="grid grid-cols-4">
                        <span className="text-sm">{t("core")}</span>
                        <span className="text-right font-medium col-span-3 text-secondary-foreground">
                          {board.cpu_core}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoardsGrid;
