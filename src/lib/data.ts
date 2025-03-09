// Interface for board data
export interface BoardData {
  product: string;
  cpu: string;
  cpu_core: string;
  dir: string;
}

// Import all README.md files from support-matrix at build time
const readmeFiles = import.meta.glob('/support-matrix/*/README.md', { as: 'raw' });

/**
 * Reads board data from local support-matrix directory
 * @param boardDir The name of the board to fetch data for
 * @returns Promise with board data or null if not found
 */
export async function getBoardData(
  boardDir: string,
): Promise<BoardData | null> {
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
      .map(path => {
        // Extract the board name from the path
        const match = path.match(/\/support-matrix\/([^\/]+)\/README\.md$/);
        return match ? match[1] : null;
      })
      .filter((name): name is string => 
        name !== null && name !== '.github' && name !== 'assets'
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
export async function getAllBoardsData(): Promise<BoardData[]> {
  const boards = await getAllBoards();
  const boardsDataPromises = boards.map((board) => getBoardData(board));
  const boardsData = await Promise.all(boardsDataPromises);

  // Filter out null values (boards that couldn't be fetched)
  return boardsData.filter((data): data is BoardData => data !== null);
}
