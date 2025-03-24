// Interface for board meta data
export interface BoardMetaData {
  product: string;
  cpu: string;
  cpu_core: string;
  dir: string;
}

// Interface for system data
export interface SysMetaData {
  sys: string;
  sys_ver: string;
  sys_var: string | null;
  status: string;
  last_update: string;
  sysDir: string;
  boardDir: string;
  fileName: string;
}

// Import all README.md files from support-matrix at build time
const readmeFiles = import.meta.glob("/support-matrix/*/README.md", {
  query: "?raw",
  import: "default",
});

/**
 * Reads board data from local support-matrix directory
 * @param boardDir The name of the board to fetch data for
 * @returns Promise with board data or null if not found
 */
export async function getBoardData(
  boardDir: string,
): Promise<BoardMetaData | null> {
  try {
    // Construct the path to the README.md file
    const readmePath = `/support-matrix/${boardDir}/README.md`;

    // Get the import function for this specific README file
    const importReadme = readmeFiles[readmePath];

    if (!importReadme) {
      console.error(`README file not found for board ${boardDir}`);
      return null;
    }

    try {
      // Load the README content
      const content = await importReadme();

      // Extract metadata from the content
      const product = extractMetadata(content, "product");
      const cpu = extractMetadata(content, "cpu");
      const cpu_core = extractMetadata(content, "cpu_core");

      return {
        product: product || "Not specified",
        cpu: cpu || "Not specified",
        cpu_core: cpu_core || "Not specified",
        dir: boardDir || "Not specified",
      };
    } catch (readError) {
      console.error(`Failed to read data for board ${boardDir}:`, readError);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching board data for ${boardDir}:`, error);
    return null;
  }
}

/**
 * Extracts metadata from README content
 * @param content The README content
 * @param key The metadata key to extract
 * @returns The extracted value or null if not found
 */
function extractMetadata(content: string, key: string): string | null {
  // Regular expression to match metadata in the format: key: value
  const regex = new RegExp(`${key}:\\s*(.+)`, "i");
  const match = content.match(regex);

  return match ? match[1].trim() : null;
}

/**
 * Gets all available boards from the local support-matrix directory
 * @returns Promise with an array of board names
 */
export async function getAllBoards(): Promise<string[]> {
  try {
    // Extract board names from the paths of all README files
    const boards = Object.keys(readmeFiles)
      .map((path) => {
        // Extract the board name from the path
        const match = path.match(/\/support-matrix\/([^\/]+)\/README\.md$/);
        return match ? match[1] : null;
      })
      .filter(
        (name): name is string =>
          name !== null && name !== ".github" && name !== "assets",
      );

    return boards;
  } catch (error) {
    console.error("Error fetching all boards:", error);
    return [];
  }
}

/**
 * Gets all board data for all available boards
 * @returns Promise with an array of board data
 */
export async function getAllBoardsData(): Promise<BoardMetaData[]> {
  const boards = await getAllBoards();
  const boardsDataPromises = boards.map((board) => getBoardData(board));
  const boardsData = await Promise.all(boardsDataPromises);

  // Filter out null values (boards that couldn't be fetched)
  return boardsData.filter((data): data is BoardMetaData => data !== null);
}

// Import all system README.md files from support-matrix at build time
const sysReadmeFiles = import.meta.glob("/support-matrix/*/*/*.md", {
  query: "?raw",
  import: "default",
});

/**
 * Reads system data from local support-matrix directory
 * @param boardDir The name of the board
 * @param sysDir The name of the system to fetch data for
 * @returns Promise with system data or null if not found
 */
export async function getSysData(
  boardDir: string,
  sysDir: string,
  fileName: string,
): Promise<SysMetaData | null> {
  try {
    // Construct the path to the system README.md file
    const readmePath = `/support-matrix/${boardDir}/${sysDir}/${fileName}.md`;

    // Get the import function for this specific README file
    const importReadme = sysReadmeFiles[readmePath];

    if (!importReadme) {
      console.error(
        `${fileName} file not found for system ${sysDir} on board ${boardDir}`,
      );
      return null;
    }

    try {
      // Load the README content
      const content = await importReadme();

      // Extract frontmatter from the content
      const frontmatter = extractFrontmatter(content);

      if (!frontmatter) {
        console.error(
          `No valid frontmatter found for system ${sysDir} on board ${boardDir}`,
        );
        return null;
      }

      return {
        sys: frontmatter.sys || "Not specified",
        sys_ver: frontmatter.sys_ver,
        sys_var: frontmatter.sys_var,
        status: frontmatter.status.toUpperCase(),
        last_update: frontmatter.last_update || "Not specified",
        sysDir: sysDir,
        boardDir: boardDir,
        fileName: fileName,
      };
    } catch (readError) {
      console.error(
        `Failed to read data for system ${sysDir} on board ${boardDir}:`,
        readError,
      );
      return null;
    }
  } catch (error) {
    console.error(
      `Error fetching system data for ${sysDir} on board ${boardDir}:`,
      error,
    );
    return null;
  }
}

/**
 * Extracts frontmatter from README content
 * @param content The README content
 * @returns The extracted frontmatter object or null if not found
 */
function extractFrontmatter(content: string): Record<string, any> | null {
  // Extract the frontmatter section between --- markers
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter: Record<string, any> = {};
  const frontmatterText = frontmatterMatch[1];

  // Process each line to extract key-value pairs
  const lines = frontmatterText.split("\n");
  for (const line of lines) {
    const keyValueMatch = line.match(/^([^:]+):\s*(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].trim();
      const value = keyValueMatch[2].trim();

      // Handle special values
      frontmatter[key] = value === "null" || value === "" ? null : value;
    }
  }

  return frontmatter;
}

/**
 * Gets all available system directories for a specific board
 * @param boardDir The name of the board
 * @returns Promise with an array of system directory names
 */
export async function getBoardSysDirs(
  boardDir: string,
): Promise<{ sysDir: string; fileName: string }[]> {
  try {
    const pattern = new RegExp(
      `^/support-matrix/${boardDir}/([^/]+)/([^/]+)\\.md$`,
    );

    // Extract system directory and file names from the paths of README files
    const sysDirInfo = Object.keys(sysReadmeFiles)
      .map((path) => {
        const match = path.match(pattern);
        // Skip files ending with _zh.md
        if (match && !match[2].endsWith("_zh")) {
          return { sysDir: match[1], fileName: match[2] };
        }
        return null;
      })
      .filter(
        (info): info is { sysDir: string; fileName: string } => info !== null,
      );

    return sysDirInfo;
  } catch (error) {
    console.error(
      `Error fetching system directories for board ${boardDir}:`,
      error,
    );
    return [];
  }
}

/**
 * Gets all system data for a specific board
 * @param boardDir The name of the board
 * @returns Promise with an array of system data
 */
export async function getBoardAllSysData(
  boardDir: string,
): Promise<SysMetaData[]> {
  const sysDirInfos = await getBoardSysDirs(boardDir);
  const sysDataPromises = sysDirInfos.map((info) =>
    getSysData(boardDir, info.sysDir, info.fileName),
  );
  const sysData = await Promise.all(sysDataPromises);

  // Filter out null values (systems that couldn't be fetched)
  return sysData.filter((data): data is SysMetaData => data !== null);
}

/**
 * Gets all system data for all available boards
 * @returns Promise with an array of system data
 */
export async function getAllSysData(): Promise<SysMetaData[]> {
  const boards = await getAllBoards();
  const allSysDataPromises = boards.flatMap(async (boardDir) => {
    const sysDirInfos = await getBoardSysDirs(boardDir);
    return sysDirInfos.map((info) =>
      getSysData(boardDir, info.sysDir, info.fileName),
    );
  });

  const allSysDataNestedPromises = await Promise.all(allSysDataPromises);
  const allSysData = await Promise.all(allSysDataNestedPromises.flat());

  // Filter out null values (systems that couldn't be fetched)
  return allSysData.filter((data): data is SysMetaData => data !== null);
}
