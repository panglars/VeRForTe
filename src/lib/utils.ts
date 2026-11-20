import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import YAML from "yaml";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Import system metadata from support-matrix/assets/metadata.yml
const systemMetadataRaw = import.meta.glob("/support-matrix/assets/metadata.yml", {
  query: "?raw",
  import: "default",
});

export interface CategorizedSystemMetadata {
  systemNames: Record<string, string>;
  systemCategories: Record<string, string>;
  categoryOrder: string[];
  systemsByCategory: Record<string, { id: string; name: string }[]>;
}

const DEFAULT_CATEGORY_ORDER = ["linux", "customized", "bsd", "rtos", "others"];

/**
 * Loads system metadata from metadata.yml with category mapping and flat lookup
 */
export async function loadCategorizedSystemMetadata(): Promise<CategorizedSystemMetadata> {
  const emptyResult: CategorizedSystemMetadata = {
    systemNames: {},
    systemCategories: {},
    categoryOrder: DEFAULT_CATEGORY_ORDER,
    systemsByCategory: {},
  };

  try {
    const metadataPath = "/support-matrix/assets/metadata.yml";
    const importMetadata = systemMetadataRaw[metadataPath];

    if (!importMetadata) {
      console.error("metadata.yml not found");
      return emptyResult;
    }

    const content = (await importMetadata()) as string;
    const parsed = YAML.parse(content);

    if (!parsed || typeof parsed !== "object") {
      return emptyResult;
    }

    const systemNames: Record<string, string> = {};
    const systemCategories: Record<string, string> = {};
    const systemsByCategory: Record<string, { id: string; name: string }[]> = {};

    for (const [category, systems] of Object.entries(parsed)) {
      if (category === "arches" || !Array.isArray(systems)) {
        continue;
      }

      if (!systemsByCategory[category]) {
        systemsByCategory[category] = [];
      }

      for (const system of systems) {
        if (typeof system === "object" && system !== null) {
          for (const [id, name] of Object.entries(system)) {
            if (typeof name === "string") {
              systemNames[id] = name;
              systemCategories[id] = category;
              systemsByCategory[category].push({ id, name });
            }
          }
        }
      }
    }

    const parsedCategories = Object.keys(systemsByCategory).filter(
      (cat) => systemsByCategory[cat].length > 0,
    );
    const categoryOrder = [
      ...DEFAULT_CATEGORY_ORDER.filter((cat) => parsedCategories.includes(cat)),
      ...parsedCategories.filter((cat) => !DEFAULT_CATEGORY_ORDER.includes(cat)),
    ];

    return {
      systemNames,
      systemCategories,
      categoryOrder,
      systemsByCategory,
    };
  } catch (error) {
    console.error("Error loading system metadata:", error);
    return emptyResult;
  }
}

/**
 * Loads system metadata from metadata.yml and creates a flat lookup map
 * @returns Record mapping system IDs to display names
 */
export async function loadSystemMetadata(): Promise<Record<string, string>> {
  const { systemNames } = await loadCategorizedSystemMetadata();
  return systemNames;
}

/**
 * Gets display name for a system ID, with fallback to the ID itself
 * @param systemId The system identifier
 * @param metadata The loaded system metadata
 * @returns Display name for the system
 */
export function getSystemDisplayName(
  systemId: string, 
  metadata: Record<string, string>
): string {
  return metadata[systemId] || systemId;
}
