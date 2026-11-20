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
  category: string;
  reports: BoardSystemReportSummary[];
}

export interface BoardOtherEntry {
  systemId: string;
  systemName: string;
  category: string;
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  provider: string | null;
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
  ram: string;
  cpuCore: string;
  isRuyiSupported: boolean;
  reports: SystemBoardReportSummary[];
}

export interface SystemOtherEntry {
  boardId: string;
  boardName: string;
  vendor: string;
  isRuyiSupported: boolean;
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  provider: string | null;
}
