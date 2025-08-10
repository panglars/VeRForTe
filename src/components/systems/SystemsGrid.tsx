import React from "react";
import { getRelativeLocaleUrl } from "astro:i18n";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ui } from "@/i18n/ui";
import { useTranslations } from "@/i18n/utils";

import type { SysMetaData } from "@/lib/data";

interface Props {
  systems: SysMetaData[];
  lang: keyof typeof ui;
}

const SystemsGrid: React.FC<Props> = ({ systems, lang }) => {
  const t = useTranslations(lang);

  // Create a unique list of systems based on sysDir
  const uniqueSystems = Array.from(
    new Map(systems.map((sys) => [sys.sysDir, sys])).values(),
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {uniqueSystems.map((sys) => (
        <div key={sys.sysDir} className="system-card">
          <a
            href={getRelativeLocaleUrl(lang, `systems/${sys.sysDir}`, {
              normalizeLocale: false,
            })}
          >
            <Card className="flex flex-col justify-center p-6 transition-transform duration-200 hover:bg-muted hover:shadow-lg hover:translate-y-[-0.25rem]">
              <CardTitle className="text-xl font-semibold mb-2 text-center">
                {sys.sysDir}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {/* TODO: add some information,support status count */}
              </p>
            </Card>
          </a>
        </div>
      ))}
    </div>
  );
};

export default SystemsGrid;
