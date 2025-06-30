import React from "react";
import { getRelativeLocaleUrl } from "astro:i18n";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { ui } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";

import type { BoardMetaData } from "@/lib/data";

interface Props {
  boards: BoardMetaData[];
  deviceNames: string[];
  lang: keyof typeof ui;
}

const BoardsGrid: React.FC<Props> = ({ boards, deviceNames, lang }) => {
  const t = useTranslations(lang);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board, index) => (
        <div key={`${board.dir}-${index}`} className="board-card">
          <a
            href={getRelativeLocaleUrl(lang, `boards/${board.dir}`, {
              normalizeLocale: false,
            })}
          >
            <Card className="h-56 transition-transform duration-200 hover:bg-muted hover:shadow-lg hover:translate-y-[-0.25rem]">
              <CardHeader>
                <CardTitle className="flex justify-between text-lg font-semibold">
                  <div>{board.product}</div>
                  {deviceNames.includes(board.vendor?.toLowerCase() || "") && (
                    <img src="/favicon.svg" alt="Ruyi" className="h-6 w-6" />
                  )}
                </CardTitle>
                <CardDescription />
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-muted-foreground">
                  <div className="grid grid-cols-4">
                    <span className="text-sm">{t("cpu")}</span>
                    <span className="text-right font-medium col-span-3 text-secondary-foreground">
                      {board.cpu}
                    </span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="text-sm">{t("ram")}</span>
                    <span className="text-right font-medium col-span-3 text-secondary-foreground">
                      {board.ram}
                    </span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="text-sm">{t("core")}</span>
                    <span className="text-right font-medium col-span-3 text-secondary-foreground">
                      {board.cpu_core}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      ))}
    </div>
  );
};

export default BoardsGrid;
