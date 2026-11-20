import type { BoardMetaData } from "@/lib/data";
import type { ReportStatus } from "@/config/site";

export interface ReportSummary {
  systemId: string;
  systemDir: string;
  boardId: string;
  fileName: string;
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  lastUpdate: string | null;
}

export interface OtherSummary {
  systemId: string;
  systemDir: string;
  boardId: string;
  status: ReportStatus;
  version: string | null;
  variant: string | null;
  provider: string | null;
  lastUpdate: string | null;
}

export interface CellData {
  reports: ReportSummary[];
  others: OtherSummary[];
}

export type MatrixData = Record<string, Record<string, CellData>>;

export interface SystemDefinition {
  id: string;
  name: string;
  category: string;
}

export interface BoardDefinition {
  id: string;
  meta: BoardMetaData;
  isRuyiSupported: boolean;
}

export interface BoardRow extends BoardDefinition {
  systems: Record<string, CellData>;
}
