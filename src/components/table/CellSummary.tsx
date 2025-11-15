import { StatusBadge } from "./StatusBadge";
import { ReportPopover } from "./ReportPopover";
import type { CellData } from "./types";
import { getRelativeUrl, type LocaleCode } from "@/i18n/utils";

interface CellSummaryProps {
  data?: CellData;
  boardId: string;
  lang: LocaleCode;
}

export function CellSummary({ data, boardId, lang }: CellSummaryProps) {
  if (!data) {
    return <span className="text-muted-foreground">-</span>;
  }

  const hasReports = data.reports.length > 0;
  const hasOthers = data.others.length > 0;

  if (!hasReports && !hasOthers) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (!hasReports && hasOthers) {
    const otherStatus = data.others[0]?.status ?? "UNKNOWN";
    return (
      <div className="flex flex-col gap-1">
        <StatusBadge status={otherStatus} />
        <span className="text-xs text-muted-foreground">others.yml</span>
      </div>
    );
  }

  if (data.reports.length === 1) {
    const report = data.reports[0];
    return (
      <a
        href={getRelativeUrl(
          lang,
          `reports/${boardId}-${report.systemDir}-${report.fileName}`,
        )}
        className="space-y-1 no-underline hover:opacity-80"
      >
        <StatusBadge status={report.status} />
        {report.version && (
          <p className="text-xs text-muted-foreground">{report.version}</p>
        )}
      </a>
    );
  }

  const trigger = (
    <div className="flex items-center gap-2">
      <StatusBadge status={data.reports[0].status} />
      <span className="text-xs text-muted-foreground">
        +{data.reports.length - 1}
      </span>
    </div>
  );

  return (
    <ReportPopover
      reports={data.reports}
      boardId={boardId}
      lang={lang}
      triggerLabel={trigger}
    />
  );
}
