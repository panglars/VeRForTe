import type {
  HomeStats,
  OverviewBoardSummary,
  OverviewSystemSummary,
  SystemBoardSummary,
} from "@/components/home/types";
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
};

function pickBestStatus(statuses: ReportStatus[]): ReportStatus | null {
  if (statuses.length === 0) return null;
  return statuses.reduce((best, current) => {
    const bestScore = STATUS_PRIORITY[best] ?? 99;
    const currentScore = STATUS_PRIORITY[current] ?? 99;
    return currentScore < bestScore ? current : best;
  });
}

export interface HomePageData {
  boards: OverviewBoardSummary[];
  systems: OverviewSystemSummary[];
  stats: HomeStats;
}

export async function getHomePageData(): Promise<HomePageData> {
  const [siteData, { systemCategories }] = await Promise.all([
    getSiteData(),
    loadCategorizedSystemMetadata(),
  ]);

  const boardMetas = Array.from(siteData.boards.values()).map((b) => b.meta);
  const ruyiSupportedDirs = await getRuyiSupportedBoardDirs(boardMetas);

  const boards: OverviewBoardSummary[] = Array.from(siteData.boards.values()).map(
    (board) => {
      const statusCounts: Partial<Record<ReportStatus, number>> = {};
      let reportCount = 0;

      for (const reports of board.systems.values()) {
        for (const report of reports) {
          if (report.sourceType === "report") {
            reportCount++;
          }
        }
        const bestStatus = pickBestStatus(reports.map((r) => r.status));
        if (bestStatus) {
          statusCounts[bestStatus] = (statusCounts[bestStatus] || 0) + 1;
        }
      }

      return {
        dir: board.meta.dir,
        vendor: board.meta.vendor,
        product: board.meta.product,
        cpu: board.meta.cpu,
        cpu_core: board.meta.cpu_core,
        ram: board.meta.ram,
        isRuyiSupported: ruyiSupportedDirs.has(board.id),
        systemCount: board.systems.size,
        reportCount,
        statusCounts,
      };
    },
  );

  const systems: OverviewSystemSummary[] = Array.from(
    siteData.systems.values(),
  ).map((system) => {
    const boardsMap = new Map<string, SystemBoardSummary>();
    const statusesByBoard = new Map<string, ReportStatus[]>();
    let reportCount = 0;

    for (const report of system.reports) {
      if (report.sourceType === "report") {
        reportCount++;
      }

      if (!boardsMap.has(report.boardId)) {
        const boardMeta = siteData.boards.get(report.boardId)?.meta;
        boardsMap.set(report.boardId, {
          id: report.boardId,
          product: boardMeta?.product || report.boardId,
          vendor: boardMeta?.vendor || "",
        });
      }

      if (!statusesByBoard.has(report.boardId)) {
        statusesByBoard.set(report.boardId, []);
      }
      statusesByBoard.get(report.boardId)!.push(report.status);
    }

    const statusCounts: Partial<Record<ReportStatus, number>> = {};
    for (const boardStatuses of statusesByBoard.values()) {
      const bestStatus = pickBestStatus(boardStatuses);
      if (bestStatus) {
        statusCounts[bestStatus] = (statusCounts[bestStatus] || 0) + 1;
      }
    }

    return {
      id: system.id,
      name: system.name,
      category: systemCategories[system.id] || "others",
      boards: Array.from(boardsMap.values()),
      reportCount,
      totalEntryCount: system.reports.length,
      statusCounts,
    };
  });

  const totalReports = siteData.allReports.filter(
    (r) => r.sourceType === "report",
  ).length;

  return {
    boards,
    systems,
    stats: {
      totalBoards: boards.length,
      totalSystems: systems.length,
      totalReports,
    },
  };
}
