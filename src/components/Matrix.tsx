import { useEffect, useState } from "react";
import YAML from "yaml";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "./DataTable";
import { useTranslations } from "@/i18n/utils";
import type { BoardMetaData, SysMetaData } from "@/lib/data";

// TypeScript interfaces
export interface SystemEntry {
  [id: string]: string;
}
interface MetadataStructure {
  linux?: SystemEntry[];
  bsd?: SystemEntry[];
  rtos?: SystemEntry[];
  others?: SystemEntry[];
  customized?: SystemEntry[];
  [key: string]: SystemEntry[] | undefined;
}
interface CategoryMap {
  [category: string]: SystemEntry[];
}
interface CategoryDataItem {
  categoryId: string;
  categoryName: string;
  systemList: SystemEntry[];
  statusMatrix: (string | null)[][];
}
interface MatrixProps {
  lang: string;
  boardsData: BoardMetaData[];
  sysData: SysMetaData[];
  metadataPath: string;
}

export default function Matrix({
  lang,
  boardsData,
  sysData,
  metadataPath = "/support-matrix/assets/metadata.yml",
}: MatrixProps) {
  const [categoryData, setCategoryData] = useState<CategoryDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const t = useTranslations(lang);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const metadataFiles = import.meta.glob(
          "/support-matrix/assets/metadata.yml",
          {
            query: "?raw",
            import: "default",
          },
        );

        const importMetadata = metadataFiles[metadataPath];
        const metadataText = await importMetadata();
        const metadata = YAML.parse(metadataText) as MetadataStructure;

        const categories: CategoryMap = {};
        Object.entries(metadata).forEach(([category, systems]) => {
          if (!categories[category]) {
            categories[category] = [];
          }

          if (systems) {
            systems.forEach((system) => {
              const entries = Object.entries(system);
              if (entries.length > 0) {
                const [id, name] = entries[0];
                categories[category].push({ id, name });
              }
            });
          }
        });

        if (categories.customized) {
          categories.linux = [
            ...(categories.linux || []),
            ...(categories.customized || []),
          ];
          delete categories.customized;
        }

        const processedCategoryData = Object.entries(categories).map(
          ([category, systemList]) => {
            const statusMatrix = boardsData.map((board) => {
              const boardSystems = sysData.filter(
                (sys) => sys.boardDir === board.dir,
              );

              return systemList.map((sysObj) => {
                const matchingSystems = boardSystems.filter(
                  (sys) => sys.sys.toLowerCase() === sysObj.id.toLowerCase(),
                );

                if (matchingSystems.length > 0) {
                  return matchingSystems[0].status.toUpperCase();
                }
                return null;
              });
            });
            return {
              categoryId: category,
              categoryName: t(category),
              systemList,
              statusMatrix,
            };
          },
        );

        setCategoryData(processedCategoryData);
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading metadata:", error);
        setIsLoading(false);
      }
    }

    loadMetadata();
  }, [boardsData, sysData, metadataPath, t]);

  const defaultTab = categoryData.length > 0 ? categoryData[0].categoryId : "";

  if (isLoading) {
    return <div className="w-full py-10 px-4">Loading...</div>;
  }

  return (
    <div className="w-full py-4 px-4">
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex justify-center mb-4">
          <TabsList className="h-10">
            {categoryData.map(({ categoryId, categoryName }) => (
              <TabsTrigger
                key={categoryId}
                value={categoryId}
                className="text-lg px-6 py-2 h-full"
              >
                {categoryName}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categoryData.map(({ categoryId, systemList, statusMatrix }) => (
          <TabsContent key={categoryId} value={categoryId} className="mt-6">
            <DataTable
              lang={lang}
              boards={boardsData}
              systems={sysData}
              systemList={systemList}
              statusMatrix={statusMatrix}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
