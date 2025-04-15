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

interface DataTableProps {
  lang: string;
  boards: BoardMetaData[];
  systems: SysMetaData[];
  systemList: SystemEntry[];
  statusMatrix: (string | null)[][];
}

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
    systemInfo: StatusSystemInfo | undefined;
  }) => {
    const t = useTranslations(lang);

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

    const canLink = systemInfo?.lastUpdate != null;
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
          className="no-underline hover:opacity-0 transition-opacity"
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
}: DataTableProps) {
  const systemsLookup = useMemo(() => {
    const map = new Map<string, SysMetaData>();
    systems.forEach((sys) => {
      map.set(`${sys.boardDir}-${sys.sys}`, sys);
    });
    return map;
  }, [systems]);

  const augmentedData = useMemo(() => {
    const data: AugmentedRowData[] = [];
    boards.forEach((board, rowIndex) => {
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
  }, [boards, statusMatrix, systemList, systemsLookup]);

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

    const systemColumns = systemList.map((system) => {
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
  }, [systemList, lang]);

  return { columns, data: augmentedData };
}

export default function DataTable({
  lang,
  boards,
  systems,
  systemList,
  statusMatrix,
}: DataTableProps) {
  const { columns, data } = useTableConfig({
    lang,
    boards,
    systems,
    systemList,
    statusMatrix,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "board", desc: false },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  });

  const stickyHeaderClass = "sticky top-0 z-30 bg-background";
  const stickyCellShadow =
    "shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.4)]";

  return (
    <div className="w-full mb-12">
      <Table className="min-w-full">
        <TableHeader className={stickyHeaderClass}>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className={clsx(
                    "whitespace-nowrap",
                    header.id === "board" &&
                      `sticky left-0 z-20 bg-background ${stickyCellShadow}`,
                    header.column.getCanSort() && "cursor-pointer select-none",
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
                className="group"
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className={clsx(
                      cell.column.id === "board" &&
                        `font-medium sticky left-0 z-10 bg-background group-hover:bg-muted/90 ${stickyCellShadow}`,
                      cell.column.id !== "board" && "group-hover:bg-muted/80",
                      "whitespace-nowrap",
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
