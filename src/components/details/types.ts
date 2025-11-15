import type { ReportStatus } from "@/config/site";

export interface BoardSystemReportSummary {
  id: string;
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  lastUpdate: Date | null;
  fileName: string;
  systemDir: string;
}

export interface BoardSystemSummary {
  systemId: string;
  systemName: string;
  reports: BoardSystemReportSummary[];
}

export interface SystemBoardReportSummary {
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  lastUpdate: Date | null;
  fileName: string;
  systemDir: string;
}

export interface SystemBoardSummary {
  boardId: string;
  boardName: string;
  vendor: string;
  cpu: string;
  reports: SystemBoardReportSummary[];
}
