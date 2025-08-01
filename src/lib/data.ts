import YAML from "yaml";
import type { ReportStatus } from "@/config/site";
import { loadSystemMetadata, getSystemDisplayName } from "@/lib/utils";

// Interface for board meta data
// https://github.com/ruyisdk/support-matrix/blob/main/report-template/%5Bboard-name%5D/README.md
export interface BoardMetaData {
  vendor: string; // Board manufacturer
  product: string; // Board name
  cpu: string; // CPU Model
  cpu_core: string; // CPU core
  ram: string; // Memory and flash information
  dir: string; // Unique ID for this board
}

// Interface for system data
// https://github.com/ruyisdk/support-matrix/blob/main/report-template/%5Bboard-name%5D/%5Bos-name%5D/README.md
export interface ReportMetaData {
  sys: string; // OS identifier
  sys_ver: string | null; // OS version
  sys_var: string | null; // Variant identifier
  status: ReportStatus; // Support Status
  last_update: Date | null; // Last Update Date
  boardId: string; // The board's 'dir'
  sourceType: "report" | "other"; // A flag to distinguish the source
  fileName: string | null; // The original .md file name, for variant system
}

// For a single Board
export interface Board {
  id: string; // The unique ID, same as meta.dir
  meta: BoardMetaData;
  systems: Map<string, ReportMetaData[]>; // All reports for this board, grouped by system name
}

// For a single OS
export interface System {
  id: string; // The unique system name, e.g., 'ubuntu'
  name: string; // The display name, e.g., 'Ubuntu'
  reports: ReportMetaData[]; // All reports for this system across all boards
}

// Site-wide statistics computed at build time
export interface SiteStatistics {
  totalBoards: number; // Total number of boards
  totalSystems: number; // Total number of unique systems
  totalReports: number; // Total number of test reports
  statusCounts: Record<ReportStatus, number>; // Count of reports by status
  systemsByCategory: Record<string, string[]>; // Systems grouped by category (Linux, BSD, etc.)
  boardsByVendor: Record<string, string[]>; // Board IDs grouped by vendor
  lastUpdated: Date; // When statistics were computed
}

// The final data object that your `data.ts` will export
export interface SiteData {
  boards: Map<string, Board>;
  systems: Map<string, System>;
  allReports: ReportMetaData[]; // A flat list of all reports
  statistics: SiteStatistics;
}

// Internal data processing interfaces
interface RawDataCollection {
  boardsData: BoardMetaData[];
  markdownReports: Omit<ReportMetaData, 'sourceType'>[];
  othersReports: Omit<ReportMetaData, 'sourceType'>[];
  systemMetadata: Record<string, string>;
}

interface ProcessedData {
  boards: Map<string, Board>;
  systems: Map<string, System>;
  allReports: ReportMetaData[];
}

// Build-time imports
const boardReadmeFiles = import.meta.glob("/support-matrix/*/README.md", {
  query: "?raw",
  import: "default",
});

const systemMarkdownFiles = import.meta.glob("/support-matrix/*/*/*.md", {
  query: "?raw",
  import: "default",
});

const othersYmlFiles = import.meta.glob("/support-matrix/*/others.yml", {
  query: "?raw",
  import: "default",
});

// Cache management for performance optimization
let siteDataCache: SiteData | null = null;
let loadingPromise: Promise<SiteData> | null = null;

/**
 * Get site data with caching mechanism
 * This should be the main function used throughout the application
 * Data is loaded only once per application lifecycle
 * @returns Cached site data
 */
export async function getSiteData(): Promise<SiteData> {
  // Return cached data if available
  if (siteDataCache) {
    return siteDataCache;
  }

  // If already loading, wait for completion
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading data
  loadingPromise = loadSiteData();
  
  try {
    siteDataCache = await loadingPromise;
    return siteDataCache;
  } finally {
    loadingPromise = null;
  }
}

/**
 * Clear data cache (development only)
 * Useful for development and testing
 */
export function clearDataCache(): void {
  if (import.meta.env.DEV) {
    siteDataCache = null;
    loadingPromise = null;
    console.log("Data cache cleared");
  }
}

/**
 * Get data loading statistics for debugging
 * @returns Current cache and loading state
 */
export function getDataLoadingStats() {
  return {
    isCached: siteDataCache !== null,
    isLoading: loadingPromise !== null,
    cacheTimestamp: siteDataCache?.statistics.lastUpdated,
    totalBoards: siteDataCache?.statistics.totalBoards,
    totalReports: siteDataCache?.statistics.totalReports,
  };
}

/**
 * Main entry point to load all site data (internal function)
 * Use getSiteData() instead for cached access
 * @returns Complete site data with boards, systems, reports and statistics
 */
async function loadSiteData(): Promise<SiteData> {
  try {
    // Phase 1: Load raw data from all sources
    const rawData = await loadRawData();
    
    // Phase 2: Process, validate and aggregate data
    const processedData = await processAndValidate(rawData);
    
    // Phase 3: Build statistics and final data structure
    const siteData = await buildStatisticsAndIndexes(processedData);
    
    return siteData;
  } catch (error) {
    console.error("Error loading site data:", error);
    throw error;
  }
}

/**
 * Phase 1: Load raw data from all sources
 */
async function loadRawData(): Promise<RawDataCollection> {
  const [boardsData, markdownReports, othersReports, systemMetadata] = await Promise.all([
    loadBoardsData(),
    loadReportsFromMarkdown(),
    loadReportsFromOthersYml(),
    loadSystemMetadata(),
  ]);

  return {
    boardsData,
    markdownReports,
    othersReports,
    systemMetadata,
  };
}

/**
 * Phase 2: Process, validate and aggregate data
 */
async function processAndValidate(raw: RawDataCollection): Promise<ProcessedData> {
  // Combine reports and add source type
  const allReports: ReportMetaData[] = [
    ...raw.markdownReports.map(r => ({ ...r, sourceType: "report" as const })),
    ...raw.othersReports.map(r => ({ ...r, sourceType: "other" as const })),
  ];

  // Validate reports
  const validReports = allReports.filter(report => {
    const isValid = validateReportData(report);
    if (!isValid) {
      console.warn("Invalid report data:", report);
    }
    return isValid;
  });

  // Aggregate into boards and systems
  const boards = aggregateToBoards(validReports, raw.boardsData);
  const systems = aggregateToSystems(validReports, raw.systemMetadata);

  const processedData = { boards, systems, allReports: validReports };

  // Validate data consistency
  validateDataConsistency(processedData);

  return processedData;
}

/**
 * Phase 3: Build statistics and final data structure
 */
async function buildStatisticsAndIndexes(data: ProcessedData): Promise<SiteData> {
  const statistics = computeStatistics(data.allReports, data.boards);

  return {
    ...data,
    statistics,
  };
}

/**
 * Load all board metadata from README.md files
 */
async function loadBoardsData(): Promise<BoardMetaData[]> {
  const boardPromises = Object.entries(boardReadmeFiles).map(async ([path, importFn]) => {
    const match = path.match(/\/support-matrix\/([^\/]+)\/README\.md$/);
    if (!match) return null;

    const boardDir = match[1];
    if (["assets", ".github", "report-template"].includes(boardDir)) return null;

    try {
      const content = (await importFn()) as string;
      const frontmatter = extractFrontmatter(content);
      
      if (!frontmatter || !frontmatter.vendor) {
        console.warn(`Invalid frontmatter for board ${boardDir}`);
        return null;
      }

      return {
        vendor: frontmatter.vendor,
        product: frontmatter.product || "Not specified",
        cpu: frontmatter.cpu || "Not specified",
        cpu_core: frontmatter.cpu_core || "Not specified",
        ram: frontmatter.ram || "Not specified",
        dir: boardDir,
      };
    } catch (error) {
      console.error(`Error loading board data for ${boardDir}:`, error);
      return null;
    }
  });

  const boardsData = await Promise.all(boardPromises);
  return boardsData.filter((board): board is BoardMetaData => board !== null);
}

/**
 * Load reports from markdown files
 */
async function loadReportsFromMarkdown(): Promise<Omit<ReportMetaData, 'sourceType'>[]> {
  const reportPromises = Object.entries(systemMarkdownFiles).map(async ([path, importFn]) => {
    const match = path.match(/\/support-matrix\/([^\/]+)\/([^\/]+)\/([^\/]+)\.md$/);
    if (!match) return null;

    const [, boardId, sysDir, fileName] = match;
    
    // Skip Chinese translations
    if (fileName.endsWith("_zh")) return null;

    try {
      const content = (await importFn()) as string;
      const frontmatter = extractFrontmatter(content);
      
      if (!frontmatter || !frontmatter.sys || !frontmatter.status) {
        console.warn(`Invalid frontmatter for ${path}`);
        return null;
      }

      return {
        sys: frontmatter.sys,
        sys_ver: frontmatter.sys_ver || null,
        sys_var: frontmatter.sys_var || null,
        status: frontmatter.status.toUpperCase() as ReportStatus,
        last_update: frontmatter.last_update ? new Date(frontmatter.last_update) : null,
        boardId,
        fileName,
      };
    } catch (error) {
      console.error(`Error loading report from ${path}:`, error);
      return null;
    }
  });

  const reports = await Promise.all(reportPromises);
  return reports.filter((report): report is Omit<ReportMetaData, 'sourceType'> => report !== null);
}

/**
 * Load reports from others.yml files
 */
async function loadReportsFromOthersYml(): Promise<Omit<ReportMetaData, 'sourceType'>[]> {
  const othersPromises = Object.entries(othersYmlFiles).map(async ([path, importFn]) => {
    const match = path.match(/\/support-matrix\/([^\/]+)\/others\.yml$/);
    if (!match) return [];

    const boardId = match[1];

    try {
      const content = (await importFn()) as string;
      const parsedData = YAML.parse(content);

      if (!Array.isArray(parsedData)) {
        console.warn(`Invalid YAML format in ${path}`);
        return [];
      }

      return parsedData.map((item: any) => ({
        sys: item.sys,
        sys_ver: item.sys_ver || null,
        sys_var: item.sys_var || null,
        status: item.status.toUpperCase() as ReportStatus,
        last_update: null,
        boardId,
        fileName: null,
      }));
    } catch (error) {
      console.error(`Error loading others.yml from ${path}:`, error);
      return [];
    }
  });

  const othersArrays = await Promise.all(othersPromises);
  return othersArrays.flat();
}

/**
 * Aggregate reports into boards structure
 */
function aggregateToBoards(reports: ReportMetaData[], boardsData: BoardMetaData[]): Map<string, Board> {
  const boardsMap = new Map<string, Board>();

  // Initialize boards from metadata
  for (const boardData of boardsData) {
    boardsMap.set(boardData.dir, {
      id: boardData.dir,
      meta: boardData,
      systems: new Map(),
    });
  }

  // Add reports to boards
  for (const report of reports) {
    const board = boardsMap.get(report.boardId);
    if (!board) {
      console.warn(`Report references non-existent board: ${report.boardId}`);
      continue;
    }

    if (!board.systems.has(report.sys)) {
      board.systems.set(report.sys, []);
    }
    board.systems.get(report.sys)!.push(report);
  }

  return boardsMap;
}

/**
 * Aggregate reports into systems structure
 */
function aggregateToSystems(reports: ReportMetaData[], systemMetadata: Record<string, string>): Map<string, System> {
  const systemsMap = new Map<string, System>();

  for (const report of reports) {
    if (!systemsMap.has(report.sys)) {
      systemsMap.set(report.sys, {
        id: report.sys,
        name: getSystemDisplayName(report.sys, systemMetadata),
        reports: [],
      });
    }
    systemsMap.get(report.sys)!.reports.push(report);
  }

  return systemsMap;
}

/**
 * Compute site-wide statistics
 */
function computeStatistics(reports: ReportMetaData[], boards: Map<string, Board>): SiteStatistics {
  // Status counts
  const statusCounts = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<ReportStatus, number>);

  // Systems by category (would need metadata.yml structure for proper categorization)
  const systemsByCategory: Record<string, string[]> = {};
  const uniqueSystems = new Set(reports.map(r => r.sys));
  systemsByCategory["all"] = Array.from(uniqueSystems);

  // Boards by vendor
  const boardsByVendor = Array.from(boards.values()).reduce((acc, board) => {
    const vendor = board.meta.vendor;
    if (!acc[vendor]) acc[vendor] = [];
    acc[vendor].push(board.id);
    return acc;
  }, {} as Record<string, string[]>);

  return {
    totalBoards: boards.size,
    totalSystems: uniqueSystems.size,
    totalReports: reports.length,
    statusCounts,
    systemsByCategory,
    boardsByVendor,
    lastUpdated: new Date(),
  };
}

/**
 * Validate individual report data
 */
function validateReportData(report: ReportMetaData): boolean {
  const validStatuses: ReportStatus[] = ["GOOD", "BASIC", "CFH", "CFT", "WIP", "CFI"];
  
  if (!report.sys || !report.boardId || !report.status) {
    return false;
  }
  
  if (!validStatuses.includes(report.status)) {
    return false;
  }
  
  return true;
}

/**
 * Validate data consistency across aggregated structures
 */
function validateDataConsistency(data: ProcessedData): void {
  const issues: string[] = [];

  // Check for orphaned reports
  data.allReports.forEach(report => {
    if (!data.boards.has(report.boardId)) {
      issues.push(`Report references non-existent board: ${report.boardId}`);
    }
  });

  // Check system report consistency
  data.systems.forEach((system, systemId) => {
    const systemReportCount = system.reports.length;
    const actualReportCount = data.allReports.filter(r => r.sys === systemId).length;
    
    if (systemReportCount !== actualReportCount) {
      issues.push(`System ${systemId} has inconsistent report count: ${systemReportCount} vs ${actualReportCount}`);
    }
  });

  if (issues.length > 0) {
    console.warn("Data consistency issues found:", issues);
  }
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatter(content: string): Record<string, any> | null {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  try {
    const frontmatter = YAML.parse(frontmatterMatch[1]);
    
    // Convert empty strings to null
    for (const key in frontmatter) {
      if (frontmatter[key] === "") {
        frontmatter[key] = null;
      }
    }
    
    return frontmatter;
  } catch (error) {
    console.error("Error parsing frontmatter YAML:", error);
    return null;
  }
}

// Development debugging tools
if (import.meta.env.DEV) {
  // Make debugging functions available globally in development
  (globalThis as any).__verforte_debug = {
    getSiteData,
    clearDataCache,
    getDataLoadingStats,
    // Internal functions for debugging
    _loadSiteData: loadSiteData,
    _extractFrontmatter: extractFrontmatter,
  };
  
  console.log("🔧 VeRForTe Debug Tools Available:");
  console.log("  - __verforte_debug.getSiteData()");
  console.log("  - __verforte_debug.clearDataCache()");
  console.log("  - __verforte_debug.getDataLoadingStats()");
}