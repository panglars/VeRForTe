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

/**
 * Loads system metadata from metadata.yml and creates a flat lookup map
 * @returns Record mapping system IDs to display names
 */
export async function loadSystemMetadata(): Promise<Record<string, string>> {
  try {
    const metadataPath = "/support-matrix/assets/metadata.yml";
    const importMetadata = systemMetadataRaw[metadataPath];
    
    if (!importMetadata) {
      console.error("metadata.yml not found");
      return {};
    }

    const content = (await importMetadata()) as string;
    const parsed = YAML.parse(content);
    
    // Flatten the nested structure into a simple id -> name mapping
    const systemMap: Record<string, string> = {};
    
    for (const [category, systems] of Object.entries(parsed)) {
      if (Array.isArray(systems)) {
        for (const system of systems) {
          if (typeof system === 'object' && system !== null) {
            // Each system is like { alpine: "Alpine" }
            for (const [id, name] of Object.entries(system)) {
              systemMap[id] = name as string;
            }
          }
        }
      }
    }
    
    return systemMap;
  } catch (error) {
    console.error("Error loading system metadata:", error);
    return {};
  }
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
