import React from "react";
import { Card } from "../ui/card";
import type { LocaleCode } from "@/i18n/utils";
import { useTranslations, getRelativeUrl } from "@/i18n/utils";
import { statusClassMap, type ReportStatus } from "@/config/site";
import { ArrowUpRight, Cpu, Layers, MemoryStick } from "lucide-react";
import clsx from "clsx";

import type { OverviewBoardSummary } from "./types";

interface Props {
  boards: OverviewBoardSummary[];
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

const BoardsCard: React.FC<Props> = ({ boards, lang }) => {
  const t = useTranslations(lang);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {boards.map((board) => {
        const statusSummary = STATUS_ORDER.map((status) => ({
          status,
          count: board.statusCounts[status] || 0,
        }))
          .filter((item) => item.count > 0)
          .slice(0, 3);

        return (
          <a
            key={board.dir}
            href={getRelativeUrl(lang, `boards/${board.dir}`)}
            className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full flex flex-col justify-between gap-0 py-0 overflow-hidden border-border/80 bg-card transition-all duration-200 group-hover:border-primary/40 group-hover:shadow-md group-hover:-translate-y-0.5">
              <div>
                <div className="p-5 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 min-h-5">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                      {board.vendor}
                    </span>
                    {board.isRuyiSupported && (
                      <span
                        title={t("card.ruyi_tooltip")}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-secondary/25 dark:bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary shrink-0"
                      >
                        <img
                          src="/favicon.svg"
                          alt=""
                          className="h-3.5 w-3.5"
                        />
                        {t("card.ruyi_badge")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold leading-snug text-card-foreground group-hover:text-primary transition-colors">
                      {board.product}
                    </h2>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5 transition-transform duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                <div className="px-5 py-3 flex-1 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground shrink-0">
                      <Cpu className="h-3.5 w-3.5" />
                      {t("cpu")}
                    </span>
                    <span className="text-right font-medium text-card-foreground/90 leading-relaxed break-words">
                      {board.cpu}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground shrink-0">
                      <MemoryStick className="h-3.5 w-3.5" />
                      {t("ram")}
                    </span>
                    <span className="text-right font-medium text-card-foreground/90 leading-relaxed break-words">
                      {board.ram}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground shrink-0">
                      <Layers className="h-3.5 w-3.5" />
                      {t("core")}
                    </span>
                    <span className="text-right font-medium text-card-foreground/90 leading-relaxed break-words">
                      {board.cpu_core}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground shrink-0">
                  {board.systemCount} {t("card.systems")}
                </span>
                <div className="flex items-center flex-wrap justify-end gap-1">
                  {statusSummary.length > 0 ? (
                    statusSummary.map(({ status, count }) => (
                      <span
                        key={status}
                        className={clsx(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                          statusClassMap[status] ?? statusClassMap.UNKNOWN,
                        )}
                      >
                        {status} {count}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground/70">
                      {t("card.no_reports")}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </a>
        );
      })}
    </div>
  );
};

export default BoardsCard;
