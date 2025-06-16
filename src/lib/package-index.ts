// Import all device files from packages-index at build time
const deviceFiles = import.meta.glob("/packages-index/entities/device/*.toml", {
  query: "?raw",
  import: "default",
});

/**
 * Gets all device names from packages-index directory
 * @returns Promise with an array of device names (without .toml extension)
 */
export async function getRuyiDeviceVendor(): Promise<string[]> {
  try {
    // Extract device names from the paths of all .toml files
    const devices = Object.keys(deviceFiles)
      .map((path) => {
        // Extract the device name from the path
        const match = path.match(
          /\/packages-index\/entities\/device\/([^\/]+)\.toml$/,
        );
        return match ? match[1] : null;
      })
      .filter((name): name is string => name !== null);

    return devices;
  } catch (error) {
    console.error("Error fetching device names:", error);
    return [];
  }
}
