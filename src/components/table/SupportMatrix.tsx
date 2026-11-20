import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowDown,
  ArrowUp,
  Info,
  Maximize2,
  Minimize2,
  Search as SearchIcon,
  X,
} from "lucide-react";
import {
  getRelativeUrl,
  useTranslations,
  type LocaleCode,
} from "@/i18n/utils";
import type { ReportStatus } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  BoardDefinition,
  CellData,
  MatrixData,
  SystemDefinition,
} from "./types";
import { CellSummary } from "./CellSummary";
import { StatusBadge } from "./StatusBadge";

interface SupportMatrixProps {
  lang: LocaleCode;
  boards: BoardDefinition[];
  systems: SystemDefinition[];
  matrix: MatrixData;
  categories?: string[];
}

const STATUS_FILTER_OPTIONS: ReportStatus[] = [
  "GOOD",
  "BASIC",
  "CFT",
  "CFH",
  "CFI",
  "WIP",
];

function cellMatchesStatus(
  cell: CellData | undefined,
  statusFilter: string,
): boolean {
  if (!cell) return false;
  const hasEntries = cell.reports.length > 0 || cell.others.length > 0;
  if (!hasEntries) return false;
  if (statusFilter === "ALL") return true;

  return (
    cell.reports.some((report) => report.status === statusFilter) ||
    cell.others.some((other) => other.status === statusFilter)
  );
}

export default function SupportMatrix({
  lang,
  boards,
  systems,
  matrix,
  categories: propCategories,
}: SupportMatrixProps) {
  const t = useTranslations(lang);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [boardSortDir, setBoardSortDir] = useState<"asc" | "desc">("asc");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const categories = useMemo(() => {
    if (propCategories && propCategories.length > 0) {
      return propCategories;
    }
    return Array.from(new Set(systems.map((s) => s.category)));
  }, [propCategories, systems]);

  const getCategoryLabel = (category: string) => {
    if (category === "all") return t("category.all");
    if (category === "customized") return t("category.customized");
    return t(category) || category;
  };

  const categorySystems = useMemo(() => {
    const filtered =
      activeCategory === "all"
        ? systems
        : systems.filter((sys) => sys.category === activeCategory);
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  }, [systems, activeCategory]);

  const visibleBoards = useMemo(() => {
    const normalizedQuery = searchQuery.toLowerCase().trim();

    const filtered = boards.filter((board) => {
      if (normalizedQuery) {
        const matchesQuery = [
          board.meta.product,
          board.meta.vendor,
          board.meta.cpu,
          board.id,
        ].some((val) => (val || "").toLowerCase().includes(normalizedQuery));
        if (!matchesQuery) return false;
      }

      const boardCells = matrix[board.id];
      if (!boardCells) return false;

      return categorySystems.some((sys) =>
        cellMatchesStatus(boardCells[sys.id], statusFilter),
      );
    });

    return [...filtered].sort((a, b) => {
      const cmp = a.meta.product.localeCompare(b.meta.product);
      return boardSortDir === "asc" ? cmp : -cmp;
    });
  }, [boards, matrix, categorySystems, searchQuery, statusFilter, boardSortDir]);

  const visibleSystems = useMemo(() => {
    return categorySystems.filter((sys) =>
      visibleBoards.some((board) =>
        cellMatchesStatus(matrix[board.id]?.[sys.id], statusFilter),
      ),
    );
  }, [categorySystems, visibleBoards, matrix, statusFilter]);

  const legendItems = useMemo(
    () => [
      { status: "GOOD", description: t("status.good") },
      { status: "BASIC", description: t("status.basic") },
      { status: "CFH", description: t("status.cfh") },
      { status: "CFT", description: t("status.cft") },
      { status: "CFI", description: t("status.cfi") },
      { status: "WIP", description: t("status.wip") },
      { status: "-", description: t("status.unknown") },
    ],
    [t],
  );

  return (
    <div
      className={clsx(
        isFullscreen
          ? "fixed inset-0 z-40 bg-background flex flex-col gap-4 p-4 sm:p-6 overflow-hidden"
          : "space-y-5 max-w-full",
      )}
    >
      <div
        className={clsx(
          "flex flex-wrap items-start justify-between gap-4",
          isFullscreen && "shrink-0",
        )}
      >
        <div>
          <h1
            className={clsx(
              "font-bold tracking-tight",
              isFullscreen ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
            )}
          >
            {t("table.title")}
          </h1>
          {!isFullscreen && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("table.subtitle")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 shrink-0"
              >
                <Info className="h-4 w-4" />
                {t("status_legend")}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 sm:w-96">
              <div className="space-y-2.5">
                <h4 className="font-semibold text-sm leading-none mb-3">
                  {t("status_legend")}
                </h4>
                {legendItems.map((item) => (
                  <div key={item.status} className="flex items-start gap-2.5">
                    <StatusBadge
                      status={item.status}
                      className="shrink-0 min-w-14"
                    />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant={isFullscreen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-pressed={isFullscreen}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                {t("table.exit_fullscreen")}
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                {t("table.fullscreen")}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeCategory}
        onValueChange={setActiveCategory}
        className={clsx("w-full", isFullscreen && "shrink-0")}
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-10">
            <TabsTrigger value="all" className="px-3.5 text-sm">
              {getCategoryLabel("all")}
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="px-3.5 text-sm"
              >
                {getCategoryLabel(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div
        className={clsx(
          "flex flex-col lg:flex-row lg:items-center justify-between gap-3",
          isFullscreen && "shrink-0",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <SearchIcon className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("table.search_placeholder")}
              className="pl-9 pr-8 h-9 bg-card"
              aria-label={t("table.search_placeholder")}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={clsx(
                "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                statusFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/60",
              )}
            >
              {t("table.all_statuses")}
            </button>
            {STATUS_FILTER_OPTIONS.map((status) => {
              const isSelected = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() =>
                    setStatusFilter(isSelected ? "ALL" : status)
                  }
                  className={clsx(
                    "rounded-md transition-all cursor-pointer ring-offset-background",
                    isSelected
                      ? "ring-2 ring-primary ring-offset-1"
                      : "opacity-75 hover:opacity-100",
                  )}
                >
                  <StatusBadge status={status} />
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground tabular-nums shrink-0">
          {t("table.showing")
            .replace("{boards}", visibleBoards.length.toString())
            .replace("{systems}", visibleSystems.length.toString())}
        </p>
      </div>

      {visibleBoards.length === 0 || visibleSystems.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card p-12 text-center text-muted-foreground">
          {t("no_results")}
        </div>
      ) : (
        <div
          className={clsx(
            isFullscreen && "flex-1 min-h-0 flex items-start",
          )}
        >
          <div
            className={clsx(
              "relative overflow-auto w-fit max-w-full rounded-xl border border-border/80 bg-card shadow-xs",
              isFullscreen ? "max-h-full" : "max-h-[75vh]",
            )}
          >
            <table className="w-auto border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-muted">
              <tr className="border-b border-border">
                <th
                  onClick={() =>
                    setBoardSortDir((prev) => (prev === "asc" ? "desc" : "asc"))
                  }
                  className="sticky left-0 top-0 z-30 bg-muted border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] min-w-[200px] px-4 py-3 text-left font-semibold cursor-pointer select-none hover:bg-accent/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{t("board")}</span>
                    {boardSortDir === "asc" ? (
                      <ArrowUp className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                </th>
                {visibleSystems.map((system) => (
                  <th
                    key={system.id}
                    className="px-3 py-3 text-center font-semibold whitespace-nowrap min-w-[96px]"
                  >
                    <a
                      href={getRelativeUrl(lang, `systems/${system.id}`)}
                      className="hover:text-primary transition-colors"
                    >
                      {system.name}
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleBoards.map((board) => (
                <tr
                  key={board.id}
                  className="group border-t border-border/70 hover:bg-muted/35 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-card group-hover:bg-muted border-r border-border shadow-[2px_0_6px_-2px_rgba(0,0,0,0.06)] px-4 py-2.5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={getRelativeUrl(lang, `boards/${board.id}`)}
                          className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-[175px]"
                          title={board.meta.product}
                        >
                          {board.meta.product}
                        </a>
                        <p className="text-xs text-muted-foreground truncate max-w-[175px]">
                          {board.meta.vendor}
                        </p>
                      </div>
                      {board.isRuyiSupported && (
                        <img
                          src="/favicon.svg"
                          alt={t("card.ruyi_badge")}
                          title={t("card.ruyi_tooltip")}
                          className="h-4 w-4 shrink-0"
                        />
                      )}
                    </div>
                  </td>
                  {visibleSystems.map((system) => {
                    const cell = matrix[board.id]?.[system.id];
                    const dimmed =
                      statusFilter !== "ALL" &&
                      Boolean(
                        cell &&
                          (cell.reports.length > 0 || cell.others.length > 0),
                      ) &&
                      !cellMatchesStatus(cell, statusFilter);

                    return (
                      <td
                        key={system.id}
                        className="px-3 py-2.5 text-center align-middle whitespace-nowrap"
                      >
                        <CellSummary
                          data={cell}
                          boardId={board.id}
                          boardName={board.meta.product}
                          systemName={system.name}
                          lang={lang}
                          dimmed={dimmed}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
