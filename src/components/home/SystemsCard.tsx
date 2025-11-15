import React from "react";
import { Card, CardTitle, CardContent } from "../ui/card";
import { ui } from "@/i18n/ui";
import { useTranslations, getRelativeUrl } from "@/i18n/utils";
import { Badge } from "../ui/badge";
import type { OverviewSystemSummary } from "./types";

interface Props {
  systems: OverviewSystemSummary[];
  lang: keyof typeof ui;
}

const SystemsCard: React.FC<Props> = ({ systems, lang }) => {
  const t = useTranslations(lang);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {systems.map((system) => (
        <div key={system.id} className="system-card">
          <a href={getRelativeUrl(lang, `systems/${system.id}`)}>
            <Card className="h-44 flex flex-col justify-between p-6 transition-transform duration-200 hover:bg-muted hover:shadow-lg hover:translate-y-[-0.25rem]">
              <CardTitle className="text-xl font-semibold mb-2">
                {system.name}
              </CardTitle>
              <CardContent className="p-0 space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("board")}</span>
                  <span className="font-medium text-secondary-foreground">
                    {system.boards.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {system.boards.slice(0, 3).map((board) => (
                    <Badge
                      key={board.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {board.product}
                    </Badge>
                  ))}
                  {system.boards.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{system.boards.length - 3}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SystemsCard;
