import clsx from "clsx";
import React, { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslations } from "@/i18n/utils";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { BoardMetaData, SysMetaData } from "@/lib/data";
import type { SystemEntry } from "./Matrix";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, FilterX, SlidersHorizontal, EyeOff } from "lucide-react";
import { defaultLang, ui } from "@/i18n/ui";

interface DataTableProps {
  lang: string;
  boards: BoardMetaData[];
  systems: SysMetaData[];
  systemList: SystemEntry[];
  statusMatrix: (string | null)[][];
  categoryId?: string;
  supportedBoardIndices?: number[];
}

type TranslateFunction = (key: keyof (typeof ui)[typeof defaultLang]) => string;

interface StatusSystemInfo {
  sysDir: string | null | undefined;
  fileName: string | null | undefined;
  lastUpdate: string | null | undefined;
}

interface StatusEntry {
  status: string | null;
  systemInfo: StatusSystemInfo | undefined;
}

interface AugmentedRowData {
  board: BoardMetaData;
  statuses: Record<string, StatusEntry>;
}

const statusClassMap: Record<string, string> = {
  GOOD: "bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100",
  BASIC: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
  CFH: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
  CFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  WIP: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-800 dark:text-fuchsia-100",
  UNKNOWN:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
};

const StatusCell = React.memo(
  ({
    status,
    lang,
    boardDir,
    systemInfo,
  }: {
    status: string | null;
    lang: string;
    boardDir: string;
    systemInfo: StatusSystemInfo | null | undefined;
  }) => {
    const safetyLang = lang as any as "en" | "zh_CN";
    const t = useTranslations(safetyLang);

    if (!status) {
      return <span className="text-muted-foreground">-</span>;
    }

    const statusClass = statusClassMap[status] ?? statusClassMap.UNKNOWN;

    const statusElement = (
      <span
        className={clsx(
          "inline-block px-2 py-1 rounded-md font-medium",
          statusClass,
        )}
      >
        {status}
      </span>
    );

    const canLink =
      systemInfo?.lastUpdate != null || systemInfo?.lastUpdate != undefined;
    if (canLink) {
      return (
        <a
          href={getRelativeLocaleUrl(
            lang,
            `board/${boardDir}/${systemInfo.sysDir}-${systemInfo.fileName}`,
            {
              normalizeLocale: false,
            },
          )}
          className="no-underline hover:opacity-80 transition-opacity"
          title={`${t("sys.update")}: ${systemInfo.lastUpdate}`}
        >
          {statusElement}
        </a>
      );
    } else {
      return <span className="no-underline">{statusElement}</span>;
    }
  },
);

StatusCell.displayName = "StatusCell";

function useTableConfig({
  lang,
  boards,
  systems,
  systemList,
  statusMatrix,
  compareMode,
  selectedBoards,
  selectedSystems,
  hideIdentical,
}: DataTableProps & {
  compareMode: boolean;
  selectedBoards: string[];
  selectedSystems: string[];
  hideIdentical: boolean;
}) {
  const systemsLookup = useMemo(() => {
    const map = new Map<string, SysMetaData>();
    systems.forEach((sys) => {
      map.set(`${sys.boardDir}-${sys.sys}`, sys);
    });
    return map;
  }, [systems]);

  const getBoardHasDifference = useMemo(() => {
    if (!compareMode || !hideIdentical || selectedSystems.length <= 1) {
      return (boardDir: string) => true;
    }

    const boardDifferenceMap = new Map<string, boolean>();

    boards.forEach((board) => {
      const boardIdx = boards.findIndex((b) => b.dir === board.dir);
      if (boardIdx === -1) return;

      const boardStatuses = statusMatrix[boardIdx] || [];

      const selectedSystemIndices = systemList
        .filter((sys) => selectedSystems.includes(sys.id))
        .map((sys) => systemList.findIndex((s) => s.id === sys.id))
        .filter((idx) => idx !== -1);

      if (selectedSystemIndices.length <= 1) {
        boardDifferenceMap.set(board.dir, true);
        return;
      }

      const statuses = selectedSystemIndices.map(
        (sysIdx) => boardStatuses[sysIdx] || null,
      );

      const hasAnySupport = statuses.some((s) => s !== null && s !== "");

      if (!hasAnySupport) {
        boardDifferenceMap.set(board.dir, false);
        return;
      }

      const validStatuses = statuses.filter((s) => s !== null && s !== "");

      if (validStatuses.length < statuses.length) {
        boardDifferenceMap.set(board.dir, true);
        return;
      }

      const allSame = validStatuses.every((s) => s === validStatuses[0]);
      boardDifferenceMap.set(board.dir, !allSame);
    });

    return (boardDir: string) => boardDifferenceMap.get(boardDir) ?? true;
  }, [
    compareMode,
    hideIdentical,
    selectedSystems,
    boards,
    statusMatrix,
    systemList,
  ]);

  const augmentedData = useMemo(() => {
    const data: AugmentedRowData[] = [];
    boards.forEach((board, rowIndex) => {
      if (
        compareMode &&
        selectedBoards.length > 0 &&
        !selectedBoards.includes(board.dir)
      ) {
        return;
      }

      if (compareMode && hideIdentical && !getBoardHasDifference(board.dir)) {
        return;
      }

      const boardStatuses = statusMatrix[rowIndex] || [];
      const statusesMap: Record<string, StatusEntry> = {};
      let hasNonNullStatus = false;

      systemList.forEach((system, colIndex) => {
        const status = boardStatuses[colIndex] ?? null;
        const systemInfo = systemsLookup.get(`${board.dir}-${system.id}`);
        statusesMap[system.id] = {
          status,
          systemInfo: systemInfo
            ? {
                sysDir: systemInfo.sysDir,
                fileName: systemInfo.fileName,
                lastUpdate: systemInfo.last_update,
              }
            : undefined,
        };
        if (status !== null && status !== "") {
          hasNonNullStatus = true;
        }
      });

      if (hasNonNullStatus) {
        data.push({
          board,
          statuses: statusesMap,
        });
      }
    });
    return data;
  }, [
    boards,
    statusMatrix,
    systemList,
    systemsLookup,
    compareMode,
    selectedBoards,
    hideIdentical,
    getBoardHasDifference,
  ]);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<AugmentedRowData>();

    const boardColumn = columnHelper.accessor("board", {
      id: "board",
      header: "Board",
      cell: (info) => info.getValue().product,
      sortingFn: (rowA, rowB) =>
        rowA.original.board.product.localeCompare(rowB.original.board.product),
      enableSorting: true,
    });

    const filteredSystemList =
      compareMode && selectedSystems.length > 0
        ? systemList.filter((system) => selectedSystems.includes(system.id))
        : systemList;

    const systemColumns = filteredSystemList.map((system) => {
      return columnHelper.accessor((row) => row.statuses[system.id], {
        id: system.id,
        header: system.name,
        cell: (info) => {
          const statusEntry = info.getValue();
          const boardDir = info.row.original.board.dir;
          return (
            <StatusCell
              status={statusEntry.status}
              lang={lang}
              boardDir={boardDir}
              systemInfo={statusEntry.systemInfo}
            />
          );
        },
        sortingFn: (rowA, rowB) => {
          const statusA = rowA.original.statuses[system.id]?.status || "";
          const statusB = rowB.original.statuses[system.id]?.status || "";
          return statusA.localeCompare(statusB);
        },
        enableSorting: true,
      });
    });

    return [boardColumn, ...systemColumns] as ColumnDef<
      AugmentedRowData,
      any
    >[];
  }, [systemList, lang, compareMode, selectedSystems]);

  return { columns, data: augmentedData };
}

const SelectionPanel = ({
  items,
  selectedItems,
  setSelectedItems,
  title,
  t,
  description,
  stats,
}: {
  items: { id: string; name: string }[];
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  title: string;
  t: TranslateFunction;
  description?: string;
  stats?: { count: number; total: number };
}) => {
  const handleToggle = (id: string) => {
    setSelectedItems(
      selectedItems.includes(id)
        ? selectedItems.filter((item) => item !== id)
        : [...selectedItems, id],
    );
  };

  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected =
    selectedItems.length > 0 && selectedItems.length < items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`select-all-${title}`}
            checked={allSelected}
            className={someSelected ? "opacity-70" : ""}
            onCheckedChange={handleSelectAll}
          />
          <label
            htmlFor={`select-all-${title}`}
            className="text-sm font-medium leading-none"
          >
            {allSelected ? t("compare.deselect_all") : t("compare.select_all")}
          </label>
        </div>
      </div>
      <ScrollArea className="h-[200px] rounded-md border p-2">
        <div className="flex flex-col gap-2 pr-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-2 px-1 py-1 rounded hover:bg-muted/50"
            >
              <Checkbox
                id={`checkbox-${item.id}`}
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => handleToggle(item.id)}
              />
              <label
                htmlFor={`checkbox-${item.id}`}
                className="text-sm font-medium leading-none flex-1 cursor-pointer"
              >
                {item.name}
              </label>
            </div>
          ))}
        </div>
      </ScrollArea>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {stats && (
        <p className="text-xs text-muted-foreground">
          {t("compare.filtered_boards")
            .replace("{count}", stats.count.toString())
            .replace("{total}", stats.total.toString())}
        </p>
      )}
    </div>
  );
};

export default function DataTable({
  lang,
  boards,
  systems,
  systemList,
  statusMatrix,
  categoryId,
  supportedBoardIndices,
}: DataTableProps) {
  const safetyLang = lang as any as "en" | "zh_CN";
  const t = useTranslations(safetyLang);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "board", desc: false },
  ]);

  const [compareMode, setCompareMode] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [tempSelectedBoards, setTempSelectedBoards] = useState<string[]>([]);
  const [tempSelectedSystems, setTempSelectedSystems] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hideIdentical, setHideIdentical] = useState(false);
  const [tempHideIdentical, setTempHideIdentical] = useState(false);

  const boardOptions = useMemo(() => {
    if (supportedBoardIndices && supportedBoardIndices.length > 0) {
      return supportedBoardIndices
        .map((index) => boards[index])
        .filter(Boolean)
        .map((board) => ({
          id: board.dir,
          name: board.product,
        }));
    }

    return boards.map((board) => ({
      id: board.dir,
      name: board.product,
    }));
  }, [boards, supportedBoardIndices]);

  const handleCompareToggle = () => {
    if (!compareMode) {
      setDialogOpen(true);
      setTempSelectedBoards(selectedBoards);
      setTempSelectedSystems(selectedSystems);
      setTempHideIdentical(hideIdentical);
    } else {
      setCompareMode(false);
      setSelectedBoards([]);
      setSelectedSystems([]);
      setHideIdentical(false);
    }
  };

  const handleApplyCompare = () => {
    setSelectedBoards(tempSelectedBoards);
    setSelectedSystems(tempSelectedSystems);
    setHideIdentical(tempHideIdentical);
    setCompareMode(true);
    setDialogOpen(false);
  };

  const { columns, data } = useTableConfig({
    lang,
    boards,
    systems,
    systemList,
    statusMatrix,
    compareMode,
    selectedBoards,
    selectedSystems,
    hideIdentical,
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  const stickyHeaderClass = "sticky top-0 z-30 bg-muted";
  const stickyCellShadow =
    "shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.4)]";

  const hideIdenticalTipKey =
    selectedSystems.length <= 1
      ? "compare.hide_identical_no_systems"
      : "compare.hide_identical_tip";

  return (
    <div className="w-full mb-12">
      <div className="flex justify-end mb-4 gap-2">
        <Button
          onClick={handleCompareToggle}
          variant={compareMode ? "destructive" : "outline"}
          className="group mb-2 flex items-center gap-2 transition-all duration-200"
          size="sm"
        >
          {compareMode ? (
            <FilterX className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <SlidersHorizontal className="h-4 w-4 transition-transform duration-200" />
          )}
          {compareMode ? t("compare.disable") : t("compare.enable")}
        </Button>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[900px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                {t("compare.title")}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
              <SelectionPanel
                items={boardOptions}
                selectedItems={tempSelectedBoards}
                setSelectedItems={setTempSelectedBoards}
                title={t("compare.select_boards")}
                t={t}
                description={
                  supportedBoardIndices && supportedBoardIndices.length > 0
                    ? t("compare.supported_boards_only")
                    : undefined
                }
                stats={
                  supportedBoardIndices && supportedBoardIndices.length > 0
                    ? {
                        count: supportedBoardIndices.length,
                        total: boards.length,
                      }
                    : undefined
                }
              />

              <SelectionPanel
                items={systemList}
                selectedItems={tempSelectedSystems}
                setSelectedItems={setTempSelectedSystems}
                title={t("compare.select_systems")}
                t={t}
              />
            </div>

            <div className="flex items-center space-x-2 mt-6 bg-muted/30 p-3 rounded-md">
              <Checkbox
                id="hide-identical"
                checked={tempHideIdentical}
                onCheckedChange={(checked) =>
                  setTempHideIdentical(checked as boolean)
                }
                className="data-[state=checked]:bg-primary"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="hide-identical"
                  className="text-sm font-medium leading-none flex items-center gap-2 cursor-pointer"
                >
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  {t("compare.hide_identical")}
                </label>
                <p className="text-xs text-muted-foreground">
                  {t(hideIdenticalTipKey)}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  setTempSelectedBoards([]);
                  setTempSelectedSystems([]);
                  setTempHideIdentical(false);
                }}
                className="flex items-center gap-2"
                size="sm"
              >
                <FilterX className="h-4 w-4" />
                {t("compare.reset")}
              </Button>
              <Button
                onClick={handleApplyCompare}
                className="flex items-center gap-2"
                size="sm"
              >
                <Check className="h-4 w-4" />
                {t("compare.apply")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {compareMode && (
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-muted/30 p-3 rounded-lg border border-muted animate-in fade-in-50 duration-300 slide-in-from-top-5">
          <div>
            <span className="font-semibold text-sm">
              {t("compare.selected_boards")}:
            </span>{" "}
            {selectedBoards.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1 max-w-[500px]">
                {selectedBoards.map((boardId) => (
                  <Badge
                    key={boardId}
                    variant="outline"
                    className="bg-background/80 backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-300"
                  >
                    {boards.find((b) => b.dir === boardId)?.product}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic text-sm">
                {t("compare.no_selection")}
              </span>
            )}
          </div>
          <div className="md:ml-6">
            <span className="font-semibold text-sm">
              {t("compare.selected_systems")}:
            </span>{" "}
            {selectedSystems.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1 max-w-[500px]">
                {selectedSystems.map((sysId) => (
                  <Badge
                    key={sysId}
                    variant="outline"
                    className="bg-background/80 backdrop-blur-sm animate-in fade-in-50 zoom-in-95 duration-300"
                  >
                    {systemList.find((s) => s.id === sysId)?.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground italic text-sm">
                {t("compare.no_selection")}
              </span>
            )}
          </div>
          {hideIdentical && (
            <div className="md:ml-auto flex items-center">
              <Badge variant="secondary" className="flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                {t("compare.hide_identical")}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div
        className={clsx(
          "transition-all duration-300",
          compareMode && "animate-in fade-in-0 zoom-in-95",
        )}
      >
        <Table className="min-w-full">
          <TableHeader className={stickyHeaderClass}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={clsx(
                      "whitespace-nowrap transition-colors",
                      header.id === "board" &&
                        `sticky left-0 z-20 bg-muted ${stickyCellShadow}`,
                      header.column.getCanSort() &&
                        "cursor-pointer select-none hover:bg-muted/80",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {!header.isPlaceholder &&
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group transition-colors hover:bg-muted/30"
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={clsx(
                        cell.column.id === "board" &&
                          `font-medium sticky left-0 z-10 bg-muted ${stickyCellShadow} group-hover:bg-muted/80`,
                        cell.column.id !== "board",
                        "whitespace-nowrap",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t("no_results")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
