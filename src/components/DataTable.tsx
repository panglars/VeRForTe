import clsx from "clsx";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getRelativeLocaleUrl } from "astro:i18n";
import type { BoardMetaData, SysMetaData } from "@/lib/data";

interface SystemListItem {
  id: string;
  name: string;
}

interface DataTableProps {
  lang: string;
  boards: BoardMetaData[];
  systems: SysMetaData[];
  systemList: SystemListItem[];
  statusMatrix: (string | null)[][];
  categoryName: string;
}

const StatusCell = ({
  status,
  lang,
  boardDir,
  systemDir,
  fileName,
  lastUpdate,
}: {
  status: string | null;
  lang: string;
  boardDir: string;
  systemDir: string;
  fileName: string;
  lastUpdate: string;
}) => {
  if (!status) return <span>-</span>;

  const statusClass =
    status === "GOOD"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
      : status === "BASIC"
        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
        : status === "CFH"
          ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
          : status === "CFT"
            ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";

  const statusElement = (
    <span
      className={`inline-block px-2 py-1 rounded-md font-medium ${statusClass}`}
    >
      {status}
    </span>
  );

  return lastUpdate == null ? (
    <span className="no-underline">{statusElement}</span>
  ) : (
    <a
      href={getRelativeLocaleUrl(
        lang,
        `board/${boardDir}/${systemDir}-${fileName}`,
        {
          normalizeLocale: false,
        },
      )}
      className="no-underline"
    >
      {statusElement}
    </a>
  );
};

export default function DataTable({
  lang,
  boards,
  systems,
  systemList,
  statusMatrix,
  categoryName,
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

  return (
    <div className="w-full mb-12">
      <h2 className="text-2xl font-bold mt-10 mb-4">{categoryName}</h2>
      <div className="overflow-x-auto w-full">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={clsx(
                      header.id === "board" && "min-w-[200px]",
                      header.column.getCanSort() &&
                        "cursor-pointer select-none",
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center">
                      {!header.isPlaceholder &&
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      {header.column.getIsSorted() &&
                        (header.column.getIsSorted() === "asc" ? "↑" : "↓")}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "board" ? "font-medium" : ""
                      }
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
                  className="text-center py-4"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function useTableConfig({ lang, boards, systems, systemList, statusMatrix }) {
  const columnHelper = createColumnHelper<{
    board: BoardMetaData;
    statuses: (string | null)[];
  }>();

  const columns = useMemo(() => {
    const boardColumn = columnHelper.accessor("board", {
      header: "Board",
      cell: (info) => info.getValue().product,
      sortingFn: (rowA, rowB) =>
        rowA.original.board.product.localeCompare(rowB.original.board.product),
    });

    const systemColumns = systemList.map((system, index) => {
      return columnHelper.accessor((row) => row.statuses[index], {
        id: system.id,
        header: system.name,
        cell: (info) => {
          const boardDir = info.row.original.board.dir;
          const systemInfo = systems.find(
            (s) => s.sys === system.id && s.boardDir === boardDir,
          );
          return (
            <StatusCell
              status={info.getValue()}
              lang={lang}
              boardDir={info.row.original.board.dir}
              systemDir={systemInfo?.sysDir}
              fileName={systemInfo?.fileName}
              lastUpdate={systemInfo?.last_update}
            />
          );
        },
        sortingFn: (rowA, rowB) => {
          const statusA = rowA.original.statuses[index] || "";
          const statusB = rowB.original.statuses[index] || "";
          return statusA.localeCompare(statusB);
        },
      });
    });

    return [boardColumn, ...systemColumns];
  }, [systemList, lang, systems]);

  const rawData = useMemo(
    () =>
      boards.map((board, rowIndex) => ({
        board,
        statuses: statusMatrix[rowIndex] || [],
      })),
    [boards, statusMatrix],
  );

  const data = useMemo(
    () =>
      rawData.filter((row) =>
        row.statuses.some((status) => status !== null && status !== ""),
      ),
    [rawData],
  );

  return { columns, data };
}
