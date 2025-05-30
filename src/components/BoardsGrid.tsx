import React, { useState, useEffect } from "react";
import SortDropdown from "./SortDropdown";
import type { SortOption } from "./SortDropdown";
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
import { ui } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";
import { getRuyiDeviceVendor } from "@/lib/data";

import type { BoardMetaData, SysMetaData } from "@/lib/data";

interface Props {
  boards: BoardMetaData[];
  sysData?: SysMetaData[];
  lang: keyof typeof ui;
}

// Sort types
type SortField = "vendor" | "product";
type SortDirection = "asc" | "desc";

interface BoardSortOption extends SortOption {
  field: SortField;
  sortFn?: (a: BoardMetaData, b: BoardMetaData) => number;
}

const BoardsGrid: React.FC<Props> = ({
  boards: initialBoards,
  sysData = [],
  lang,
}) => {
  // Get translation function directly in the component
  const t = useTranslations(lang);

  const [boardToSystems, setBoardToSystems] = useState<
    Record<string, string[]>
  >({});
  const [deviceNames, setDeviceNames] = useState<string[]>([]);

  useEffect(() => {
    if (sysData && sysData.length > 0) {
      const mapping: Record<string, string[]> = {};

      sysData.forEach((system) => {
        if (!mapping[system.boardDir]) {
          mapping[system.boardDir] = [];
        }

        if (system.sys && !mapping[system.boardDir].includes(system.sys)) {
          mapping[system.boardDir].push(system.sys);
        }
      });

      setBoardToSystems(mapping);
    }
  }, [sysData]);

  useEffect(() => {
    // Load device names
    getRuyiDeviceVendor().then(setDeviceNames);
  }, []);

  const sortOptions: BoardSortOption[] = [
    {
      id: "vendor-asc",
      label: t("sort.ruyi"),
      field: "vendor",
      direction: "asc",
      sortFn: (a, b) => {
        const vendorA = a.vendor?.toLowerCase() || "";
        const vendorB = b.vendor?.toLowerCase() || "";

        const isDeviceA = deviceNames.includes(vendorA);
        const isDeviceB = deviceNames.includes(vendorB);

        // If both are devices or both are not devices, sort by product
        if (isDeviceA === isDeviceB) {
          return a.product.localeCompare(b.product);
        }

        // If only one is a device, it comes first
        return isDeviceA ? -1 : 1;
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
  const [currentSort, setCurrentSort] = useState<BoardSortOption>(
    sortOptions[0],
  );
  const [visibleBoards, setVisibleBoards] = useState<BoardMetaData[]>([]);
  const [hasResults, setHasResults] = useState<boolean>(true);

  // Apply initial sort on component mount
  useEffect(() => {
    sortBoards(initialBoards, currentSort);
  }, [initialBoards, deviceNames]);

  // Function to sort boards
  const sortBoards = (boards: BoardMetaData[], sortOption: BoardSortOption) => {
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

      const supportedSystems = boardToSystems[board.dir] || [];
      const systemsStr = supportedSystems.join(" ").toLowerCase();

      return [product, cpu, cpuCore, systemsStr].some((attr) =>
        attr.includes(normalizedQuery),
      );
    });

    // Sort filtered boards
    sortBoards(filteredBoards, currentSort);
  };

  // Handle sort change
  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSort(sortOption as BoardSortOption);

    // Apply new sort to current visible boards based on current search
    const boardsToSort = searchQuery.trim()
      ? initialBoards.filter((board) => {
          const normalizedQuery = searchQuery.toLowerCase().trim();
          const product = board.product.toLowerCase();
          const cpu = board.cpu.toLowerCase();
          const cpuCore = board.cpu_core.toLowerCase();

          const supportedSystems = boardToSystems[board.dir] || [];
          const systemsStr = supportedSystems.join(" ").toLowerCase();

          return [product, cpu, cpuCore, systemsStr].some((attr) =>
            attr.includes(normalizedQuery),
          );
        })
      : initialBoards;

    sortBoards(boardsToSort, sortOption as BoardSortOption);
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
                <Card className="h-56 transition-transform duration-200 hover:bg-muted hover:shadow-lg hover:translate-y-[-0.25rem]">
                  <CardHeader>
                    <CardTitle className="flex justify-between text-lg font-semibold">
                      <div>{board.product}</div>
                      {deviceNames.includes(
                        board.vendor?.toLowerCase() || "",
                      ) && (
                        <img
                          src="/favicon.svg"
                          alt="Ruyi"
                          className="h-6 w-6"
                        />
                      )}
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
