import React, { useState, useEffect } from "react";
import SortDropdown from "./SortDropdown";
import type { SortOption } from "./SortDropdown";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";
import BoardsGrid from "./boards/BoardsGrid";
import SystemsGrid from "./systems/SystemsGrid";
import { useTranslations } from "@/i18n/utils";
import { getRuyiDeviceVendor } from "@/lib/package-index";
import type { BoardMetaData, SysMetaData } from "@/lib/data";
import { ui } from "@/i18n/ui";
import { Button } from "./ui/button";

interface Props {
  boards: BoardMetaData[];
  sysData?: SysMetaData[];
  lang: keyof typeof ui;
}

type View = "boards" | "systems";
type SortField = "vendor" | "product" | "sys" | "boardDir";

interface GenericSortOption extends SortOption {
  field: SortField;
  sortFn?: (a: any, b: any) => number;
}

const Overview: React.FC<Props> = ({
  boards: initialBoards,
  sysData: initialSysData = [],
  lang,
}) => {
  const t = useTranslations(lang);

  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleBoards, setVisibleBoards] =
    useState<BoardMetaData[]>(initialBoards);
  const [visibleSystems, setVisibleSystems] =
    useState<SysMetaData[]>(initialSysData);
  const [view, setView] = useState<View>("boards");

  const boardSortOptions: GenericSortOption[] = [
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
  ];

  const systemSortOptions: GenericSortOption[] = [
    {
      id: "sys-asc",
      label: t("sort.asc"),
      field: "sys",
      direction: "asc",
      sortFn: (a, b) => (a.sys || "").localeCompare(b.sys || ""),
    },
    {
      id: "sys-desc",
      label: t("sort.desc"),
      field: "sys",
      direction: "desc",
      sortFn: (a, b) => (b.sys || "").localeCompare(a.sys || ""),
    },
    {
      id: "board-asc",
      label: "Board Asc",
      field: "boardDir",
      direction: "asc",
      sortFn: (a, b) => (a.boardDir || "").localeCompare(b.boardDir || ""),
    },
    {
      id: "board-desc",
      label: "Board Desc",
      field: "boardDir",
      direction: "desc",
      sortFn: (a, b) => (b.boardDir || "").localeCompare(a.boardDir || ""),
    },
  ];

  const [currentSort, setCurrentSort] = useState<GenericSortOption>(
    boardSortOptions[0],
  );

  useEffect(() => {
    const initialSort = () => {
      const defaultSort = boardSortOptions[0];
      setCurrentSort(defaultSort);
      applyFilterAndSort(searchQuery, defaultSort);
    };

    getRuyiDeviceVendor().then((names) => {
      setDeviceNames(names);
      initialSort();
    });

    if (deviceNames.length === 0) {
      initialSort();
    }
  }, [initialBoards, initialSysData, deviceNames]);

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

  const applyFilterAndSort = (query: string, sortOption: GenericSortOption) => {
    const normalizedQuery = query.toLowerCase().trim();

    let filteredBoards = initialBoards;
    let filteredSystems = initialSysData;

    if (normalizedQuery) {
      filteredBoards = initialBoards.filter((board) => {
        const product = board.product.toLowerCase();
        const cpu = board.cpu.toLowerCase();
        const cpuCore = board.cpu_core.toLowerCase();
        return [product, cpu, cpuCore].some((attr) =>
          attr.includes(normalizedQuery),
        );
      });

      filteredSystems = initialSysData.filter((sys) => {
        const sysName = sys.sys.toLowerCase();
        const boardName = sys.boardDir.toLowerCase();
        return [sysName, boardName].some((attr) =>
          attr.includes(normalizedQuery),
        );
      });
    }

    const isBoardSort = ["vendor", "product"].includes(sortOption.field);

    if (isBoardSort) {
      setVisibleBoards(
        sortItems(filteredBoards, sortOption) as BoardMetaData[],
      );
      setVisibleSystems(
        sortItems(filteredSystems, systemSortOptions[0]) as SysMetaData[],
      );
    } else {
      setVisibleBoards(
        sortItems(filteredBoards, boardSortOptions[0]) as BoardMetaData[],
      );
      setVisibleSystems(
        sortItems(filteredSystems, sortOption) as SysMetaData[],
      );
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    applyFilterAndSort(newQuery, currentSort);
  };

  const handleSortChange = (sortOption: SortOption) => {
    const newSortOption = sortOption as GenericSortOption;
    setCurrentSort(newSortOption);
    applyFilterAndSort(searchQuery, newSortOption);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    if (newView === "boards") {
      const newSort = boardSortOptions[0];
      setCurrentSort(newSort);
      applyFilterAndSort(searchQuery, newSort);
    } else {
      const newSort = systemSortOptions[0];
      setCurrentSort(newSort);
      applyFilterAndSort(searchQuery, newSort);
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
        <BoardsGrid
          boards={visibleBoards}
          deviceNames={deviceNames}
          lang={lang}
        />
      )}

      {hasResults && view === "systems" && (
        <SystemsGrid systems={visibleSystems} lang={lang} />
      )}
    </div>
  );
};

export default Overview;
