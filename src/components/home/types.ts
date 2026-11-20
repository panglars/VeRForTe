import type { ReportStatus } from "@/config/site";

export interface OverviewBoardSummary {
  dir: string;
  vendor: string;
  product: string;
  cpu: string;
  cpu_core: string;
  ram: string;
  isRuyiSupported: boolean;
  systemCount: number;
  reportCount: number;
  statusCounts: Partial<Record<ReportStatus, number>>;
}

export interface SystemBoardSummary {
  id: string;
  product: string;
  vendor: string;
}

export interface OverviewSystemSummary {
  id: string;
  name: string;
  category: string;
  boards: SystemBoardSummary[];
  reportCount: number;
  totalEntryCount: number;
  statusCounts: Partial<Record<ReportStatus, number>>;
}

export interface HomeStats {
  totalBoards: number;
  totalSystems: number;
  totalReports: number;
}
