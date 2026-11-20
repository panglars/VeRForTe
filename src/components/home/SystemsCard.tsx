import React from "react";
import { Card } from "../ui/card";
import type { LocaleCode } from "@/i18n/utils";
import { useTranslations, getRelativeUrl } from "@/i18n/utils";
import { statusClassMap, type ReportStatus } from "@/config/site";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import type { OverviewSystemSummary } from "./types";

interface Props {
  systems: OverviewSystemSummary[];
  lang: LocaleCode;
}

const STATUS_ORDER: ReportStatus[] = [
  "GOOD",
  "BASIC",
  "CFT",
  "CFH",
  "CFI",
  "WIP",
];

const STATUS_BAR_COLOR: Record<ReportStatus, string> = {
  GOOD: "bg-sky-500",
  BASIC: "bg-green-500",
  CFT: "bg-slate-400",
  CFH: "bg-red-500",
  CFI: "bg-yellow-500",
  WIP: "bg-fuchsia-500",
};

const SystemsCard: React.FC<Props> = ({ systems, lang }) => {
  const t = useTranslations(lang);

  const getCategoryLabel = (category: string) => {
    if (category === "customized") {
      return t("category.customized");
    }
    return t(category) || category;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {systems.map((system) => {
        const statusEntries = STATUS_ORDER.map((status) => ({
          status,
          count: system.statusCounts[status] || 0,
        })).filter((item) => item.count > 0);

        const totalStatuses = statusEntries.reduce(
          (sum, item) => sum + item.count,
          0,
        );

        return (
          <a
            key={system.id}
            href={getRelativeUrl(lang, `systems/${system.id}`)}
            className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full flex flex-col justify-between gap-0 py-0 overflow-hidden border-border/80 bg-card transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md group-hover:-translate-y-0.5">
              <div>
                <div className="p-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {getCategoryLabel(system.category)}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 shrink-0 transition-transform duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>

                  <h2 className="text-lg font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors">
                    {system.name}
                  </h2>
                </div>

                <div className="px-5 py-3 flex-1 space-y-3">
                  {totalStatuses > 0 && (
                    <div className="space-y-2">
                      <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-muted">
                        {statusEntries.map(({ status, count }) => (
                          <div
                            key={status}
                            className={STATUS_BAR_COLOR[status]}
                            style={{
                              width: `${(count / totalStatuses) * 100}%`,
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {statusEntries.slice(0, 4).map(({ status, count }) => (
                          <span
                            key={status}
                            className={clsx(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                              statusClassMap[status] ?? statusClassMap.UNKNOWN,
                            )}
                          >
                            {status} {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {system.boards.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {system.boards.slice(0, 3).map((board) => (
                        <span
                          key={board.id}
                          className="inline-flex items-center bg-muted/70 text-foreground/80 border border-border/60 rounded-md px-2 py-0.5 text-[11px] truncate max-w-[140px]"
                        >
                          {board.product}
                        </span>
                      ))}
                      {system.boards.length > 3 && (
                        <span className="text-[11px] font-medium text-muted-foreground px-1">
                          +{system.boards.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {system.boards.length} {t("card.boards")}
                </span>
                <span>
                  {system.reportCount} {t("card.reports")}
                </span>
              </div>
            </Card>
          </a>
        );
      })}
    </div>
  );
};

export default SystemsCard;
