import type {
  BoardDefinition,
  MatrixData,
  SystemDefinition,
} from "@/components/table/types";
import type { ReportStatus } from "@/config/site";
import { getSiteData } from "@/lib/data";
import { getRuyiSupportedBoardDirs } from "@/lib/package-index";
import { loadCategorizedSystemMetadata } from "@/lib/utils";

const STATUS_PRIORITY: Record<ReportStatus | string, number> = {
  GOOD: 0,
  BASIC: 1,
  CFT: 2,
  CFH: 3,
  CFI: 4,
  WIP: 5,
  UNKNOWN: 6,
};

export interface SupportMatrixData {
  boards: BoardDefinition[];
  systems: SystemDefinition[];
  matrix: MatrixData;
  categories: string[];
}

export async function getSupportMatrixData(): Promise<SupportMatrixData> {
  const [siteData, { systemCategories, categoryOrder }] = await Promise.all([
    getSiteData(),
    loadCategorizedSystemMetadata(),
  ]);

  const boardMetas = Array.from(siteData.boards.values()).map((b) => b.meta);
  const ruyiSupportedDirs = await getRuyiSupportedBoardDirs(boardMetas);

  const boards: BoardDefinition[] = Array.from(siteData.boards.values()).map(
    (board) => ({
      id: board.id,
      meta: board.meta,
      isRuyiSupported: ruyiSupportedDirs.has(board.id),
    }),
  );

  const systems: SystemDefinition[] = Array.from(siteData.systems.values()).map(
    (system) => ({
      id: system.id,
      name: system.name,
      category: systemCategories[system.id] || "others",
    }),
  );

  const presentCategories = new Set(systems.map((s) => s.category));
  const categories = [
    ...categoryOrder.filter((cat) => presentCategories.has(cat)),
    ...Array.from(presentCategories).filter(
      (cat) => !categoryOrder.includes(cat),
    ),
  ];

  const matrix: MatrixData = {};

  function ensureCell(boardId: string, systemId: string) {
    if (!matrix[boardId]) {
      matrix[boardId] = {};
    }
    if (!matrix[boardId][systemId]) {
      matrix[boardId][systemId] = { reports: [], others: [] };
    }
    return matrix[boardId][systemId];
  }

  for (const system of siteData.systems.values()) {
    for (const report of system.reports) {
      const cell = ensureCell(report.boardId, system.id);
      const lastUpdateIso = report.last_update
        ? report.last_update.toISOString()
        : null;

      if (report.sourceType === "report" && report.fileName) {
        cell.reports.push({
          systemId: system.id,
          systemDir: report.systemDir,
          boardId: report.boardId,
          fileName: report.fileName,
          status: report.status,
          version: report.sys_ver || null,
          variant: report.sys_var || null,
          lastUpdate: lastUpdateIso,
        });
      } else {
        cell.others.push({
          systemId: system.id,
          systemDir: report.systemDir,
          boardId: report.boardId,
          status: report.status,
          version: report.sys_ver || null,
          variant: report.sys_var || null,
          provider: report.provider || null,
          lastUpdate: lastUpdateIso,
        });
      }
    }
  }

  const compareEntries = (
    a: { status: string; lastUpdate: string | null },
    b: { status: string; lastUpdate: string | null },
  ) => {
    const statusDelta =
      (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
    if (statusDelta !== 0) return statusDelta;
    const timeA = a.lastUpdate ? Date.parse(a.lastUpdate) : 0;
    const timeB = b.lastUpdate ? Date.parse(b.lastUpdate) : 0;
    return timeB - timeA;
  };

  for (const boardId of Object.keys(matrix)) {
    for (const systemId of Object.keys(matrix[boardId])) {
      const cell = matrix[boardId][systemId];
      cell.reports.sort(compareEntries);
      cell.others.sort(compareEntries);
    }
  }

  return {
    boards,
    systems,
    matrix,
    categories,
  };
}
