import { useMemo } from "react";
import type {
  BoardDefinition,
  MatrixData,
  SystemDefinition,
} from "./types";
import { CellSummary } from "./CellSummary";

interface SupportMatrixProps {
  lang: string;
  boards: BoardDefinition[];
  systems: SystemDefinition[];
  matrix: MatrixData;
}

export default function SupportMatrix({
  lang,
  boards,
  systems,
  matrix,
}: SupportMatrixProps) {
  const sortedBoards = useMemo(
    () => [...boards].sort((a, b) => a.meta.product.localeCompare(b.meta.product)),
    [boards],
  );

  const sortedSystems = useMemo(
    () => [...systems].sort((a, b) => a.name.localeCompare(b.name)),
    [systems],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Matrix View</h2>
          <p className="text-sm text-muted-foreground">
            Status summary across boards and systems
          </p>
        </div>
      </div>
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="sticky left-0 bg-muted/60 px-4 py-3 text-left font-semibold">
                Board
              </th>
              {sortedSystems.map((system) => (
                <th
                  key={system.id}
                  className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                >
                  {system.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBoards.map((board) => (
              <tr key={board.id} className="border-t">
                <td className="sticky left-0 bg-background px-4 py-3 font-medium text-sm">
                  <div>{board.meta.product}</div>
                  <p className="text-xs text-muted-foreground">
                    {board.meta.vendor}
                  </p>
                </td>
                {sortedSystems.map((system) => (
                  <td key={system.id} className="px-4 py-3 align-top">
                    <CellSummary
                      data={matrix[board.id]?.[system.id]}
                      boardId={board.id}
                      lang={lang}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
