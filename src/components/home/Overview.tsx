import React, { useState, useMemo } from "react";
import SortDropdown from "./SortDropdown";
import type { SortOption } from "./SortDropdown";
import { Input } from "../ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { useTranslations, type LocaleCode } from "@/i18n/utils";
import BoardsCard from "./BoardsCard";
import SystemsCard from "./SystemsCard";
import type { OverviewBoardSummary, OverviewSystemSummary } from "./types";
import clsx from "clsx";

interface Props {
  boards: OverviewBoardSummary[];
  systems: OverviewSystemSummary[];
  lang: LocaleCode;
}

type View = "boards" | "systems";
type SortField = "vendor" | "product" | "systemCount" | "systemName" | "boardCount";

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

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [view, setView] = useState<View>("boards");
  const [currentSortId, setCurrentSortId] = useState<string>("vendor-asc");

  const boardSortOptions: GenericSortOption[] = useMemo(
    () => [
      {
        id: "vendor-asc",
        label: t("sort.ruyi"),
        field: "vendor",
        direction: "asc",
        sortFn: (a: OverviewBoardSummary, b: OverviewBoardSummary) => {
          if (a.isRuyiSupported !== b.isRuyiSupported) {
            return a.isRuyiSupported ? -1 : 1;
          }
          return (a.product || "").localeCompare(b.product || "");
        },
      },
      {
        id: "most-systems",
        label: t("sort.most_systems"),
        field: "systemCount",
        direction: "desc",
        sortFn: (a: OverviewBoardSummary, b: OverviewBoardSummary) =>
          b.systemCount - a.systemCount ||
          (a.product || "").localeCompare(b.product || ""),
      },
      {
        id: "product-asc",
        label: t("sort.asc"),
        field: "product",
        direction: "asc",
        sortFn: (a: OverviewBoardSummary, b: OverviewBoardSummary) =>
          (a.product || "").localeCompare(b.product || ""),
      },
      {
        id: "product-desc",
        label: t("sort.desc"),
        field: "product",
        direction: "desc",
        sortFn: (a: OverviewBoardSummary, b: OverviewBoardSummary) =>
          (b.product || "").localeCompare(a.product || ""),
      },
    ],
    [t],
  );

  const systemSortOptions: GenericSortOption[] = useMemo(
    () => [
      {
        id: "most-boards",
        label: t("sort.most_boards"),
        field: "boardCount",
        direction: "desc",
        sortFn: (a: OverviewSystemSummary, b: OverviewSystemSummary) =>
          b.boards.length - a.boards.length || a.name.localeCompare(b.name),
      },
      {
        id: "system-name-asc",
        label: t("sort.asc"),
        field: "systemName",
        direction: "asc",
        sortFn: (a: OverviewSystemSummary, b: OverviewSystemSummary) =>
          a.name.localeCompare(b.name),
      },
      {
        id: "system-name-desc",
        label: t("sort.desc"),
        field: "systemName",
        direction: "desc",
        sortFn: (a: OverviewSystemSummary, b: OverviewSystemSummary) =>
          b.name.localeCompare(a.name),
      },
    ],
    [t],
  );

  const currentSort = useMemo(() => {
    const activeOptions =
      view === "boards" ? boardSortOptions : systemSortOptions;
    return (
      activeOptions.find((opt) => opt.id === currentSortId) || activeOptions[0]
    );
  }, [view, currentSortId, boardSortOptions, systemSortOptions]);

  const sortItems = <T,>(items: T[], sortOption: GenericSortOption): T[] => {
    if (sortOption.sortFn) {
      return [...items].sort(sortOption.sortFn);
    }
    return [...items].sort((a: any, b: any) => {
      const valueA = a[sortOption.field] || "";
      const valueB = b[sortOption.field] || "";
      return sortOption.direction === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  };

  const filteredData = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    let filteredBoards = initialBoards;
    let filteredSystems = initialSystems;

    if (normalizedQuery) {
      filteredBoards = initialBoards.filter((board) => {
        const product = board.product.toLowerCase();
        const vendor = board.vendor.toLowerCase();
        const cpu = board.cpu.toLowerCase();
        const cpuCore = board.cpu_core.toLowerCase();
        const ram = board.ram.toLowerCase();
        const dir = board.dir.toLowerCase();
        return [product, vendor, cpu, cpuCore, ram, dir].some((attr) =>
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

    const sortedBoards =
      view === "boards"
        ? sortItems(filteredBoards, currentSort)
        : sortItems(filteredBoards, boardSortOptions[0]);

    const sortedSystems =
      view === "systems"
        ? sortItems(filteredSystems, currentSort)
        : sortItems(filteredSystems, systemSortOptions[0]);

    return { sortedBoards, sortedSystems };
  }, [filteredData, view, currentSort, boardSortOptions, systemSortOptions]);

  const { sortedBoards: visibleBoards, sortedSystems: visibleSystems } =
    sortedData;

  const handleSortChange = (sortOption: SortOption) => {
    setCurrentSortId(sortOption.id);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
    if (newView === "boards") {
      setCurrentSortId("vendor-asc");
    } else {
      setCurrentSortId("most-boards");
    }
  };

  const hasResults =
    (view === "boards" && visibleBoards.length > 0) ||
    (view === "systems" && visibleSystems.length > 0);

  return (
    <div>
      <div className="max-w-xl w-full mx-auto mt-6 mb-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("search_placeholder") || "Search..."}
            className="h-12 pl-11 pr-10 w-full text-base rounded-xl border-border/80 bg-card/90 shadow-xs"
            aria-label="Search"
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div
          role="tablist"
          aria-label="View mode"
          className="inline-flex items-center rounded-lg border border-border/80 bg-muted/60 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "boards"}
            onClick={() => handleViewChange("boards")}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer",
              view === "boards"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{t("board")}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({visibleBoards.length})
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "systems"}
            onClick={() => handleViewChange("systems")}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all cursor-pointer",
              view === "systems"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{t("system")}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({visibleSystems.length})
            </span>
          </button>
        </div>

        <SortDropdown
          options={view === "boards" ? boardSortOptions : systemSortOptions}
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      </div>

      {!hasResults && (
        <div className="text-center p-10 border border-border/80 rounded-xl bg-card/50 mt-6">
          <p className="text-muted-foreground">
            {t("no_results") || "No results found."}
          </p>
        </div>
      )}

      {hasResults && view === "boards" && (
        <BoardsCard boards={visibleBoards} lang={lang} />
      )}

      {hasResults && view === "systems" && (
        <SystemsCard systems={visibleSystems} lang={lang} />
      )}
    </div>
  );
};

export default Overview;
