// Interface for board data
export interface BoardData {
  product: string;
  cpu: string;
  cpu_core: string;
  readmeUrl: string;
  dir: string;
}

/**
 * Fetches board data from GitHub repository
 * @param boardDir The name of the board to fetch data for
 * @returns Promise with board data or null if not found
 */
export async function getBoardData(
  boardDir: string,
): Promise<BoardData | null> {
  try {
    // Construct the URL to the raw README.md file
    const readmeUrl = `https://raw.githubusercontent.com/ruyisdk/support-matrix/main/${boardDir}/README.md`;

    // Fetch the README content
    const response = await fetch(readmeUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch data for board ${boardDir}: ${response.statusText}`,
      );
      return null;
    }

    const content = await response.text();

    // Extract metadata from the content
    const product = extractMetadata(content, "product");
    const cpu = extractMetadata(content, "cpu");
    const cpu_core = extractMetadata(content, "cpu_core");

    return {
      product: product || "Not specified",
      cpu: cpu || "Not specified",
      cpu_core: cpu_core || "Not specified",
      readmeUrl: readmeUrl,
      dir: boardDir || "Not specified",
    };
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
 * Fetches all available boards from the repository
 * @returns Promise with an array of board names
 */
export async function getAllBoards(): Promise<string[]> {
  try {
    // Fetch the repository contents to get all directories (each directory is a board)
    const url = "https://api.github.com/repos/ruyisdk/support-matrix/contents";
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `Failed to fetch repository contents: ${response.statusText}`,
      );
      return [];
    }

    const contents = await response.json();

    // Filter for directories only
    const boards = contents
      .filter(
        (item: any) =>
          item.type === "dir" &&
          item.name !== ".github" &&
          item.name !== "assets",
      )
      .map((item: any) => item.name);

    // console.log(boards);

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
