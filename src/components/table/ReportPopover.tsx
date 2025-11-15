import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "./StatusBadge";
import type { ReportSummary } from "./types";
import { Calendar, ExternalLink } from "lucide-react";
import { useTranslations, getRelativeUrl, type LocaleCode } from "@/i18n/utils";

interface ReportPopoverProps {
  reports: ReportSummary[];
  boardId: string;
  lang: LocaleCode;
  triggerLabel: React.ReactNode;
}

export function ReportPopover({
  reports,
  boardId,
  lang,
  triggerLabel,
}: ReportPopoverProps) {
  const t = useTranslations(lang);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-auto px-2 py-1 text-left">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {reports.map((report) => (
              <a
                key={report.fileName}
                href={getRelativeUrl(
                  lang,
                  `reports/${boardId}-${report.systemDir}-${report.fileName}`,
                )}
                className="block px-4 py-3 hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <StatusBadge status={report.status} />
                    {report.version && (
                      <p className="text-sm font-medium">{report.version}</p>
                    )}
                    {report.variant && (
                      <p className="text-xs text-muted-foreground">
                        {t("sys.variant")}: {report.variant}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-center text-xs text-muted-foreground gap-1">
                  <Calendar className="h-3 w-3" />
                  {report.lastUpdate
                    ? report.lastUpdate.toLocaleDateString()
                    : "-"}
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
