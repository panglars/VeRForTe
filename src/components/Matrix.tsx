import { useEffect, useState, useMemo } from "react";
import YAML from "yaml";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTable from "./DataTable";
import { useTranslations } from "@/i18n/utils";
import type { BoardMetaData, SysMetaData } from "@/lib/data";

export interface SystemEntry {
  id: string;
  name: string;
}
interface RawSystemEntry {
  [id: string]: string;
}
interface MetadataStructure {
  linux?: RawSystemEntry[];
  bsd?: RawSystemEntry[];
  rtos?: RawSystemEntry[];
  others?: RawSystemEntry[];
  customized?: RawSystemEntry[];
  [key: string]: RawSystemEntry[] | undefined;
}
interface CategoryMap {
  [category: string]: SystemEntry[];
}
interface CategoryDataItem {
  categoryId: string;
  categoryName: string;
  systemList: SystemEntry[];
  statusMatrix: (string | null)[][];
  supportedBoardIndices: number[];
}
interface MatrixProps {
  lang: string;
  boardsData: BoardMetaData[];
  sysData: SysMetaData[];
  metadataPath?: string;
}

function parseSystemEntry(entry: RawSystemEntry): SystemEntry | null {
  const entries = Object.entries(entry);
  if (entries.length > 0) {
    const [id, name] = entries[0];
    if (
      typeof id === "string" &&
      typeof name === "string" &&
      id.trim() !== "" &&
      name.trim() !== ""
    ) {
      return { id, name };
    }
  }
  console.warn("Skipping invalid system entry format:", entry);
  return null;
}

export default function Matrix({
  lang,
  boardsData,
  sysData,
  metadataPath = "/support-matrix/assets/metadata.yml",
}: MatrixProps) {
  const [metadataText, setMetadataText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");

  const Lang = lang as any as "en" | "zh_CN";
  const t = useTranslations(Lang);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setMetadataText(null);

    async function loadMetadata() {
      try {
        const metadataFiles = import.meta.glob(
          "/support-matrix/assets/metadata.yml",
          {
            query: "?raw",
            import: "default",
          },
        );

        const globKey = metadataPath.startsWith("/")
          ? metadataPath
          : `/${metadataPath}`;

        const importMetadata = metadataFiles[globKey];

        if (!importMetadata) {
          throw new Error(`Metadata file not found in glob: ${globKey}`);
        }

        const rawText = (await importMetadata()) as string;

        if (isMounted) {
          setMetadataText(rawText);
        }
      } catch (err: any) {
        console.error("Error loading metadata file:", err);
        if (isMounted) {
          setError(`Failed to load support data. ${err.message || ""}`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [metadataPath]);

  const categoryData = useMemo<CategoryDataItem[]>(() => {
    if (!metadataText || !boardsData || !sysData || error) {
      return [];
    }

    try {
      const metadata = YAML.parse(metadataText) as MetadataStructure;
      const categories: CategoryMap = {};

      Object.entries(metadata).forEach(([categoryKey, systems]) => {
        if (!categories[categoryKey]) {
          categories[categoryKey] = [];
        }
        if (systems) {
          systems.forEach((system) => {
            const parsedEntry = parseSystemEntry(system);
            if (parsedEntry) {
              categories[categoryKey].push(parsedEntry);
            }
          });
        }
      });

      if (categories.customized) {
        categories.linux = [
          ...(categories.linux || []),
          ...categories.customized,
        ];
        delete categories.customized;
      }

      // HACK: only delete 'arches' categories, not used
      if (categories.arches) {
        delete categories.arches;
      }

      const processedData = Object.entries(categories).map(
        ([categoryId, systemList]) => {
          const systemsByBoardDir = new Map<string, SysMetaData[]>();
          sysData.forEach((sys) => {
            if (!systemsByBoardDir.has(sys.boardDir)) {
              systemsByBoardDir.set(sys.boardDir, []);
            }
            systemsByBoardDir.get(sys.boardDir)?.push(sys);
          });

          const statusMatrix = boardsData.map((board) => {
            const boardSystems = systemsByBoardDir.get(board.dir) || [];

            return systemList.map((sysObj) => {
              const matchingSystem = boardSystems.find(
                (sys) => sys.sys.toLowerCase() === sysObj.id.toLowerCase(),
              );
              return matchingSystem?.status
                ? matchingSystem.status.toUpperCase()
                : null;
            });
          });

          const supportedBoardIndices: number[] = [];
          statusMatrix.forEach((boardStatuses, boardIdx) => {
            const hasSupport = boardStatuses.some(
              (status) => status !== null && status !== "",
            );
            if (hasSupport) {
              supportedBoardIndices.push(boardIdx);
            }
          });

          return {
            categoryId,
            categoryName: t(categoryId) || categoryId,
            systemList,
            statusMatrix,
            supportedBoardIndices,
          };
        },
      );

      return processedData.filter((cat) => cat.systemList.length > 0);
    } catch (parseError: any) {
      console.error("Error parsing metadata YAML:", parseError);
      return [];
    }
  }, [metadataText, boardsData, sysData, t, error]);

  const defaultTab = useMemo(() => {
    return categoryData.length > 0 ? categoryData[0].categoryId : "";
  }, [categoryData]);

  useEffect(() => {
    if (defaultTab && !activeCategory) {
      setActiveCategory(defaultTab);
    }
  }, [defaultTab, activeCategory]);

  if (isLoading) {
    return (
      <div className="w-full py-10 px-4 text-center">{t("loading")}...</div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-10 px-4 text-center text-red-600">
        {t("error")}: {error}
      </div>
    );
  }

  return (
    <div className="w-full py-4 px-4">
      <Tabs
        defaultValue={defaultTab}
        className="w-full"
        onValueChange={(value) => setActiveCategory(value)}
        value={activeCategory}
      >
        <div className="flex justify-center mb-4 overflow-x-auto pb-2">
          <TabsList className="h-10 flex-shrink-0">
            {categoryData.map(({ categoryId, categoryName }) => (
              <TabsTrigger
                key={categoryId}
                value={categoryId}
                className="text-base sm:text-lg px-4 sm:px-6 py-2 h-full whitespace-nowrap"
              >
                {categoryName}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categoryData.map(
          ({ categoryId, systemList, statusMatrix, supportedBoardIndices }) => (
            <TabsContent
              key={categoryId}
              value={categoryId}
              className="mt-6 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <DataTable
                lang={lang}
                boards={boardsData}
                systems={sysData}
                systemList={systemList}
                statusMatrix={statusMatrix}
                categoryId={categoryId}
                supportedBoardIndices={supportedBoardIndices}
              />
            </TabsContent>
          ),
        )}
      </Tabs>
    </div>
  );
}
