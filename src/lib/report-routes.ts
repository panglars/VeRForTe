import type { ReportMetaData } from "@/lib/data";

export interface ReportRouteParts {
  boardId: string;
  systemDir: string;
  fileName: string;
}

export function getReportRoutePath(parts: ReportRouteParts): string {
  return `reports/${parts.boardId}-${parts.systemDir}-${parts.fileName}`;
}

export function getReportRouteParams(report: ReportMetaData) {
  if (report.sourceType !== "report" || !report.fileName) {
    return null;
  }

  return {
    board: report.boardId,
    system: report.systemDir,
    file: report.fileName,
  };
}

export function findReportByRoute(
  reports: ReportMetaData[],
  parts: ReportRouteParts,
) {
  return reports.find(
    (report) =>
      report.sourceType === "report" &&
      report.boardId === parts.boardId &&
      report.systemDir === parts.systemDir &&
      report.fileName === parts.fileName,
  );
}

export function getReportMarkdownPath(parts: ReportRouteParts): string {
  return `/support-matrix/${parts.boardId}/${parts.systemDir}/${parts.fileName}.md`;
}

export function getZhReportMarkdownPath(parts: ReportRouteParts): string {
  return `/support-matrix/${parts.boardId}/${parts.systemDir}/${parts.fileName}_zh.md`;
}
