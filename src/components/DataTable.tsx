import React, { useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getRelativeLocaleUrl } from "astro:i18n";

export interface BoardMetaData {
  product: string;
  cpu: string;
  cpu_core: string;
  dir: string;
}

export interface SysMetaData {
  sys: string;
  sys_ver: string;
  sys_var: string | null;
  status: string;
  last_update: string;
  dir: string;
  boardDir: string;
}

interface DataTableProps {
  lang: string;
  boards: BoardMetaData;
  systems: SysMetaData;
  systemList;
  statusMatrix: (string | null)[][];
  categoryName: string;
}

const StatusCell = ({
  status,
  lang,
  boardDir,
  systemDir,
}: {
  status: string | null;
  lang: string;
  boardDir: string;
  systemDir: string;
}) => {
  if (!status) return <span>-</span>;

  const statusClass =
    status === "GOOD"
      ? "bg-blue-100 text-blue-800"
      : status === "BASIC"
        ? "bg-green-100 text-green-800"
        : status === "CFH"
          ? "bg-red-100 text-red-800"
          : "bg-gray-100 text-gray-800"; // CFT and others

  const statusElement = (
    <span
      className={`inline-block px-2 py-1 rounded-full font-medium ${statusClass}`}
    >
      {status}
    </span>
  );

  return (
    <a
      href={getRelativeLocaleUrl(lang, `board/${boardDir}/${systemDir}`, {
        normalizeLocale: false,
      })}
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
  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(() => {
    // Create board column
    const boardColumn = columnHelper.accessor("board", {
      header: "Board",
      cell: (info) => info.getValue().product,
    });

    // Create system columns
    const systemColumns = systemList.map((system, index) =>
      columnHelper.accessor((row) => row.statuses[index], {
        id: system.id,
        header: system.name,
        cell: (info) => {
          const systemInfo = systems.find((s) => s.sys === system.id);
          return (
            <StatusCell
              status={info.getValue()}
              lang={lang}
              boardDir={info.row.original.board.dir}
              systemDir={systemInfo?.dir}
            />
          );
        },
      }),
    );

    return [boardColumn, ...systemColumns];
  }, [systemList, lang]);

  // Prepare data for the table
  const data = useMemo(
    () =>
      boards.map((board, rowIndex) => ({
        board,
        statuses: statusMatrix[rowIndex] || [],
      })),
    [boards, statusMatrix],
  );

  const table = useReactTable({
    data,
    columns,
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
                    className={header.id === "board" ? "min-w-[200px]" : ""}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.id === "board" ? "font-medium" : ""}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
