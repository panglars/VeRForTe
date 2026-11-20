import { useState } from "react";
import { Calendar, ExternalLink } from "lucide-react";
import clsx from "clsx";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { StatusBadge } from "./StatusBadge";
import type { CellData } from "./types";
import {
  getRelativeUrl,
  useTranslations,
  type LocaleCode,
} from "@/i18n/utils";

interface CellSummaryProps {
  data?: CellData;
  boardId: string;
  boardName: string;
  systemName: string;
  lang: LocaleCode;
  dimmed?: boolean;
}

function formatDate(value: string | null, lang: LocaleCode): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString(lang === "zh-CN" ? "zh-CN" : "en-US");
}

export function CellSummary({
  data,
  boardId,
  boardName,
  systemName,
  lang,
  dimmed = false,
}: CellSummaryProps) {
  const t = useTranslations(lang);
  const [open, setOpen] = useState(false);

  if (!data) {
    return <span className="text-muted-foreground/40 select-none">-</span>;
  }

  const hasReports = data.reports.length > 0;
  const hasOthers = data.others.length > 0;

  if (!hasReports && !hasOthers) {
    return <span className="text-muted-foreground/40 select-none">-</span>;
  }

  const totalEntries = data.reports.length + data.others.length;
  const primaryStatus =
    data.reports[0]?.status ?? data.others[0]?.status ?? "UNKNOWN";

  const triggerInner = (
    <>
      <StatusBadge status={primaryStatus} />
      {totalEntries > 1 && (
        <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
          +{totalEntries - 1}
        </span>
      )}
    </>
  );

  const isSingleReport = data.reports.length === 1 && data.others.length === 0;
  const singleReportUrl = isSingleReport
    ? getRelativeUrl(
        lang,
        `reports/${boardId}-${data.reports[0].systemDir}-${data.reports[0].fileName}`,
      )
    : undefined;

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={120}
      closeDelay={150}
    >
      <HoverCardTrigger asChild>
        {isSingleReport && singleReportUrl ? (
          <a
            href={singleReportUrl}
            className={clsx(
              "inline-flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-85 transition-opacity",
              dimmed && "opacity-35 hover:opacity-75",
            )}
          >
            {triggerInner}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={clsx(
              "inline-flex items-center gap-1 rounded-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:opacity-85 transition-opacity",
              dimmed && "opacity-35 hover:opacity-75",
            )}
          >
            {triggerInner}
          </button>
        )}
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        sideOffset={6}
        className="w-80 p-0 overflow-hidden text-left"
      >
        <div className="px-3.5 py-2.5 border-b bg-muted/40 flex items-center justify-between gap-2">
          <span className="font-semibold text-xs text-foreground truncate">
            {boardName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {systemName}
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto">
          {hasReports && (
            <div>
              {hasOthers && (
                <div className="px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/50">
                  {t("table.test_reports")}
                </div>
              )}
              {data.reports.map((report) => (
                <a
                  key={`${report.systemDir}-${report.fileName}`}
                  href={getRelativeUrl(
                    lang,
                    `reports/${boardId}-${report.systemDir}-${report.fileName}`,
                  )}
                  className="block px-3.5 py-2.5 hover:bg-accent/60 transition-colors border-b last:border-b-0 border-border/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center flex-wrap gap-2 min-w-0">
                      <StatusBadge status={report.status} />
                      <span className="text-sm font-medium text-foreground truncate">
                        {report.version || t("table.default_version")}
                      </span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {report.variant && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("sys.variant")}: {report.variant}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(report.lastUpdate, lang)}
                    </span>
                    <span className="text-[11px] font-medium text-primary">
                      {t("table.view_report")}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {hasOthers && (
            <div>
              <div
                className={clsx(
                  "px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/50",
                  hasReports && "border-t",
                )}
              >
                {t("table.additional_entries")}
              </div>
              {data.others.map((other, index) => (
                <div
                  key={`${other.status}-${other.version || "none"}-${index}`}
                  className="px-3.5 py-2.5 space-y-1.5 border-b last:border-b-0 border-border/50"
                >
                  <div className="flex items-center flex-wrap gap-2">
                    <StatusBadge status={other.status} />
                    {other.version && (
                      <span className="text-sm font-medium text-foreground">
                        {other.version}
                      </span>
                    )}
                    {other.variant && (
                      <span className="text-xs text-muted-foreground">
                        {other.variant}
                      </span>
                    )}
                  </div>
                  {other.provider && (
                    <p className="text-xs text-muted-foreground">
                      {t("table.provider")}: {other.provider}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground/75 italic">
                    {t("table.no_detailed_report")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
