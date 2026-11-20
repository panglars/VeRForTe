import type {
  BoardOtherEntry,
  BoardSystemSummary,
  SystemBoardSummary,
  SystemOtherEntry,
} from "@/components/details/types";
import type { ReportStatus } from "@/config/site";
import { getSiteData, type Board, type System } from "@/lib/data";
import { getRuyiSupportedBoardDirs } from "@/lib/package-index";
import { loadCategorizedSystemMetadata } from "@/lib/utils";

export const STATUS_ORDER: ReportStatus[] = [
  "GOOD",
  "BASIC",
  "CFT",
  "CFH",
  "CFI",
  "WIP",
];

export const STATUS_BAR_COLOR: Record<ReportStatus, string> = {
  GOOD: "bg-sky-500",
  BASIC: "bg-green-500",
  CFT: "bg-slate-400",
  CFH: "bg-red-500",
  CFI: "bg-yellow-500",
  WIP: "bg-fuchsia-500",
};

const STATUS_PRIORITY: Record<ReportStatus | string, number> = {
  GOOD: 0,
  BASIC: 1,
  CFT: 2,
  CFH: 3,
  CFI: 4,
  WIP: 5,
};

export function pickBestStatus(statuses: ReportStatus[]): ReportStatus | null {
  if (statuses.length === 0) return null;
  return statuses.reduce((best, current) => {
    const bestScore = STATUS_PRIORITY[best] ?? 99;
    const currentScore = STATUS_PRIORITY[current] ?? 99;
    return currentScore < bestScore ? current : best;
  });
}

export interface BoardDetailData {
  board: Board | null;
  isRuyiSupported: boolean;
  systems: BoardSystemSummary[];
  otherEntries: BoardOtherEntry[];
  totalSystems: number;
  totalReports: number;
  statusCounts: Partial<Record<ReportStatus, number>>;
}

export async function getBoardDetailData(
  boardId: string | undefined,
): Promise<BoardDetailData> {
  if (!boardId) {
    return {
      board: null,
      isRuyiSupported: false,
      systems: [],
      otherEntries: [],
      totalSystems: 0,
      totalReports: 0,
      statusCounts: {},
    };
  }

  const [siteData, { systemCategories }] = await Promise.all([
    getSiteData(),
    loadCategorizedSystemMetadata(),
  ]);

  const board = siteData.boards.get(boardId) ?? null;
  if (!board) {
    return {
      board: null,
      isRuyiSupported: false,
      systems: [],
      otherEntries: [],
      totalSystems: 0,
      totalReports: 0,
      statusCounts: {},
    };
  }

  const ruyiSupportedDirs = await getRuyiSupportedBoardDirs([board.meta]);
  const isRuyiSupported = ruyiSupportedDirs.has(board.id);

  const otherEntries: BoardOtherEntry[] = [];
  const statusCounts: Partial<Record<ReportStatus, number>> = {};
  let totalReports = 0;

  const systems: BoardSystemSummary[] = Array.from(board.systems.entries())
    .map(([systemId, reports]) => {
      const systemName = siteData.systems.get(systemId)?.name || systemId;
      const category = systemCategories[systemId] || "others";

      const bestStatus = pickBestStatus(reports.map((r) => r.status));
      if (bestStatus) {
        statusCounts[bestStatus] = (statusCounts[bestStatus] || 0) + 1;
      }

      for (const report of reports) {
        if (report.sourceType === "report") {
          totalReports++;
        } else if (report.sourceType === "other") {
          otherEntries.push({
            systemId,
            systemName,
            category,
            status: report.status,
            version: report.sys_ver || null,
            variant: report.sys_var || null,
            provider: report.provider || null,
          });
        }
      }

      const validReports = reports.filter(
        (report) => report.sourceType === "report" && report.fileName,
      );

      if (validReports.length === 0) {
        return null;
      }

      const normalizedReports = validReports
        .map((report) => ({
          id: `${systemId}-${report.fileName}`,
          status: report.status,
          version: report.sys_ver || null,
          variant: report.sys_var || null,
          lastUpdate: report.last_update || null,
          fileName: report.fileName!,
          systemDir: report.systemDir || systemId,
        }))
        .sort((a, b) => {
          const timeA = a.lastUpdate ? a.lastUpdate.getTime() : 0;
          const timeB = b.lastUpdate ? b.lastUpdate.getTime() : 0;
          return timeB - timeA;
        });

      return {
        systemId,
        systemName,
        category,
        reports: normalizedReports,
      };
    })
    .filter((system): system is BoardSystemSummary => Boolean(system))
    .sort((a, b) => a.systemName.localeCompare(b.systemName));

  otherEntries.sort((a, b) => a.systemName.localeCompare(b.systemName));

  return {
    board,
    isRuyiSupported,
    systems,
    otherEntries,
    totalSystems: board.systems.size,
    totalReports,
    statusCounts,
  };
}

export interface SystemDetailData {
  system: System | null;
  category: string;
  boards: SystemBoardSummary[];
  otherEntries: SystemOtherEntry[];
  totalBoards: number;
  totalReports: number;
  statusCounts: Partial<Record<ReportStatus, number>>;
}

export async function getSystemDetailData(
  systemId: string | undefined,
): Promise<SystemDetailData> {
  if (!systemId) {
    return {
      system: null,
      category: "others",
      boards: [],
      otherEntries: [],
      totalBoards: 0,
      totalReports: 0,
      statusCounts: {},
    };
  }

  const [siteData, { systemCategories }] = await Promise.all([
    getSiteData(),
    loadCategorizedSystemMetadata(),
  ]);

  const system = siteData.systems.get(systemId) ?? null;
  const category = systemCategories[systemId] || "others";

  if (!system) {
    return {
      system: null,
      category,
      boards: [],
      otherEntries: [],
      totalBoards: 0,
      totalReports: 0,
      statusCounts: {},
    };
  }

  const allBoardMetas = Array.from(siteData.boards.values()).map((b) => b.meta);
  const ruyiSupportedDirs = await getRuyiSupportedBoardDirs(allBoardMetas);

  const boardMap = new Map<string, SystemBoardSummary>();
  const otherEntries: SystemOtherEntry[] = [];
  const statusesByBoard = new Map<string, ReportStatus[]>();
  let totalReports = 0;

  for (const report of system.reports) {
    if (!statusesByBoard.has(report.boardId)) {
      statusesByBoard.set(report.boardId, []);
    }
    statusesByBoard.get(report.boardId)!.push(report.status);

    const boardMeta = siteData.boards.get(report.boardId)?.meta;
    const boardName = boardMeta?.product || report.boardId;
    const vendor = boardMeta?.vendor || "";
    const isRuyiSupported = ruyiSupportedDirs.has(report.boardId);

    if (report.sourceType === "report" && report.fileName) {
      totalReports++;
      if (!boardMap.has(report.boardId)) {
        boardMap.set(report.boardId, {
          boardId: report.boardId,
          boardName,
          vendor,
          cpu: boardMeta?.cpu || "",
          ram: boardMeta?.ram || "",
          cpuCore: boardMeta?.cpu_core || "",
          isRuyiSupported,
          reports: [],
        });
      }

      boardMap.get(report.boardId)!.reports.push({
        status: report.status,
        version: report.sys_ver || null,
        variant: report.sys_var || null,
        lastUpdate: report.last_update || null,
        fileName: report.fileName,
        systemDir: report.systemDir || systemId,
      });
    } else if (report.sourceType === "other") {
      otherEntries.push({
        boardId: report.boardId,
        boardName,
        vendor,
        isRuyiSupported,
        status: report.status,
        version: report.sys_ver || null,
        variant: report.sys_var || null,
        provider: report.provider || null,
      });
    }
  }

  const statusCounts: Partial<Record<ReportStatus, number>> = {};
  for (const boardStatuses of statusesByBoard.values()) {
    const bestStatus = pickBestStatus(boardStatuses);
    if (bestStatus) {
      statusCounts[bestStatus] = (statusCounts[bestStatus] || 0) + 1;
    }
  }

  const boards = Array.from(boardMap.values())
    .map((board) => ({
      ...board,
      reports: board.reports.sort((a, b) => {
        const timeA = a.lastUpdate ? a.lastUpdate.getTime() : 0;
        const timeB = b.lastUpdate ? b.lastUpdate.getTime() : 0;
        return timeB - timeA;
      }),
    }))
    .sort((a, b) => a.boardName.localeCompare(b.boardName));

  otherEntries.sort((a, b) => a.boardName.localeCompare(b.boardName));

  return {
    system,
    category,
    boards,
    otherEntries,
    totalBoards: statusesByBoard.size,
    totalReports,
    statusCounts,
  };
}
