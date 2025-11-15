import React, { useState, useEffect, useMemo } from "react";
import SortDropdown from "./SortDropdown";
import type { SortOption } from "./SortDropdown";
import { Input } from "../ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useTranslations } from "@/i18n/utils";
import { getRuyiDeviceVendor } from "@/lib/package-index";
import type { BoardMetaData } from "@/lib/data";
import { ui } from "@/i18n/ui";
import { Button } from "../ui/button";
import BoardsCard from "./BoardsCard";
import SystemsCard from "./SystemsCard";
import type { OverviewSystemSummary } from "./types";

interface Props {
  boards: BoardMetaData[];
  systems: OverviewSystemSummary[];
  lang: keyof typeof ui;
}

type View = "boards" | "systems";
type SortField = "vendor" | "product" | "systemName";

interface GenericSortOption extends SortOption {
  field: SortField;
  sortFn?: (a: any, b: any) => number;
}

const Overview: React.FC<Props> = ({
  boards: initialBoards,
  systems: initialSystems = [],
  lang,
}) => {
  const t = useTranslations(lang);

  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [view, setView] = useState<View>("boards");
  const [currentSortId, setCurrentSortId] = useState<string>("vendor-asc");

  useEffect(() => {
    getRuyiDeviceVendor().then((names) => {
      setDeviceNames(names);
    });
  }, []);

  const boardSortOptions: GenericSortOption[] = useMemo(
    () => [
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
          if (isDeviceA === isDeviceB) {
            return (a.product || "").localeCompare(b.product || "");
          }
          return isDeviceA ? -1 : 1;
        },
      },
      {
        id: "product-asc",
        label: t("sort.asc"),
        field: "product",
        direction: "asc",
        sortFn: (a, b) => (a.product || "").localeCompare(b.product || ""),
      },
      {
        id: "product-desc",
        label: t("sort.desc"),
        field: "product",
        direction: "desc",
        sortFn: (a, b) => (b.product || "").localeCompare(a.product || ""),
      },
    ],
    [deviceNames, t],
  );

  const systemSortOptions: GenericSortOption[] = useMemo(
    () => [
      {
        id: "system-name-asc",
        label: t("sort.asc"),
        field: "systemName",
        direction: "asc",
        sortFn: (a, b) => a.name.localeCompare(b.name),
      },
      {
        id: "system-name-desc",
        label: t("sort.desc"),
        field: "systemName",
        direction: "desc",
        sortFn: (a, b) => b.name.localeCompare(a.name),
      },
    ],
    [t],
  );

  const currentSort = useMemo(() => {
    const allOptions = [...boardSortOptions, ...systemSortOptions];
    return (
      allOptions.find((opt) => opt.id === currentSortId) || boardSortOptions[0]
    );
  }, [currentSortId, boardSortOptions, systemSortOptions]);

  const sortItems = (items: any[], sortOption: GenericSortOption) => {
    if (sortOption.sortFn) {
      return [...items].sort(sortOption.sortFn);
    }
    return [...items].sort((a, b) => {
      const valueA = a[sortOption.field] || "";
      const valueB = b[sortOption.field] || "";
      return sortOption.direction === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    let filteredBoards = initialBoards;
    let filteredSystems = initialSystems;

    if (normalizedQuery) {
      filteredBoards = initialBoards.filter((board) => {
        const product = board.product.toLowerCase();
        const cpu = board.cpu.toLowerCase();
        const cpuCore = board.cpu_core.toLowerCase();
        return [product, cpu, cpuCore].some((attr) =>
          attr.includes(normalizedQuery),
        );
      });

      filteredSystems = initialSystems.filter((system) => {
        const name = system.name.toLowerCase();
        const id = system.id.toLowerCase();
        const boardMatches = system.boards.some((board) => {
          const product = board.product?.toLowerCase() || "";
          const vendor = board.vendor?.toLowerCase() || "";
          const boardId = board.id.toLowerCase();
          return [product, vendor, boardId].some((attr) =>
            attr.includes(normalizedQuery),
          );
        });

        return (
          name.includes(normalizedQuery) ||
          id.includes(normalizedQuery) ||
          boardMatches
        );
      });
    }

    return { filteredBoards, filteredSystems };
  }, [initialBoards, initialSystems, searchQuery]);

  const sortedData = useMemo(() => {
    const { filteredBoards, filteredSystems } = filteredData;
    const isBoardSort = ["vendor", "product"].includes(currentSort.field);

    let sortedBoards: BoardMetaData[];
    let sortedSystems: OverviewSystemSummary[];

    if (isBoardSort) {
      sortedBoards = sortItems(filteredBoards, currentSort) as BoardMetaData[];
      sortedSystems = sortItems(
        filteredSystems,
        systemSortOptions[0],
      ) as OverviewSystemSummary[];
    } else {
      sortedBoards = sortItems(
        filteredBoards,
        boardSortOptions[0],
      ) as BoardMetaData[];
      sortedSystems = sortItems(
        filteredSystems,
        currentSort,
      ) as OverviewSystemSummary[];
    }

    return { sortedBoards, sortedSystems };
  }, [filteredData, currentSort, boardSortOptions, systemSortOptions]);

  const { sortedBoards: visibleBoards, sortedSystems: visibleSystems } =
    sortedData;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSortId(sortOption.id);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    if (newView === "boards") {
      setCurrentSortId("vendor-asc");
    } else {
      setCurrentSortId("system-name-asc");
    }
  };

  const hasResults =
    (view === "boards" && visibleBoards.length > 0) ||
    (view === "systems" && visibleSystems.length > 0);

  return (
    <div>
      <div className="max-w-xl w-full mx-auto md:my-16 my-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t("search_placeholder") || "Search..."}
            className="pl-12 py-6 w-full text-lg rounded-md border border-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            aria-label="Search"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            variant={view === "boards" ? "secondary" : "ghost"}
            onClick={() => handleViewChange("boards")}
            className="mr-2"
          >
            {t("board")}
          </Button>
          <Button
            variant={view === "systems" ? "secondary" : "ghost"}
            onClick={() => handleViewChange("systems")}
          >
            {t("system")}
          </Button>
        </div>
        <SortDropdown
          options={view === "boards" ? boardSortOptions : systemSortOptions}
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      </div>

      {!hasResults && (
        <div className="text-center p-8 border rounded-lg mt-8">
          <p className="text-muted-foreground">
            {t("no_results") || "No results found."}
          </p>
        </div>
      )}

      {hasResults && view === "boards" && (
        <BoardsCard
          boards={visibleBoards}
          deviceNames={deviceNames}
          lang={lang}
        />
      )}

      {hasResults && view === "systems" && (
        <SystemsCard systems={visibleSystems} lang={lang} />
      )}
    </div>
  );
};

export default Overview;
