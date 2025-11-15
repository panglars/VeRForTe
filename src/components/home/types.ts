import type { ReportStatus } from "@/config/site";

export interface SystemBoardSummary {
  id: string;
  product: string;
  vendor: string;
}

export interface OverviewSystemSummary {
  id: string;
  name: string;
  boards: SystemBoardSummary[];
  reportCount: number;
  statusCounts: Partial<Record<ReportStatus, number>>;
}
