import type { BoardMetaData } from "@/lib/data";

// Import all device files from packages-index at build time
const deviceFiles = import.meta.glob("/packages-index/entities/device/*.toml", {
  query: "?raw",
  import: "default",
});

interface RuyiDeviceEntry {
  id: string;
  displayName: string;
}

const DEVICE_BOARD_ALIASES: Record<string, string[]> = {
  "awol-d1dev": ["NeZha"],
  "milkv-duo": ["Duo", "Duo256m"],
  "milkv-pioneer": ["Pioneer"],
  "canaan-k230": ["K230"],
  "canaan-k510": ["K510"],
  "sipeed-licheerv": ["LicheeRV_Dock"],
  "sipeed-maix1": ["Maix-I_K210"],
  "sipeed-tangmega138kpro": ["Tang_Mega_138K"],
  "zhihe-a210-sodimm": ["A210_SODIMM_V2"],
};

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

let ruyiDevicesCache: Promise<RuyiDeviceEntry[]> | null = null;

async function loadRuyiDevices(): Promise<RuyiDeviceEntry[]> {
  if (ruyiDevicesCache) {
    return ruyiDevicesCache;
  }

  ruyiDevicesCache = (async () => {
    try {
      const entries = await Promise.all(
        Object.entries(deviceFiles).map(async ([path, importFn]) => {
          const match = path.match(
            /\/packages-index\/entities\/device\/([^/]+)\.toml$/,
          );
          if (!match) return null;

          const id = match[1];
          const content = (await importFn()) as string;
          const displayNameMatch = content.match(
            /display_name\s*=\s*"([^"]+)"/,
          );

          return {
            id,
            displayName: displayNameMatch ? displayNameMatch[1] : id,
          };
        }),
      );

      return entries.filter(
        (entry): entry is RuyiDeviceEntry => entry !== null,
      );
    } catch (error) {
      console.error("Error loading RuyiSDK device definitions:", error);
      return [];
    }
  })();

  return ruyiDevicesCache;
}

/**
 * Matches boards from support-matrix against RuyiSDK packages-index device entities.
 * Executed at build time so no raw .toml files are bundled to the client.
 */
export async function getRuyiSupportedBoardDirs(
  boards: BoardMetaData[],
): Promise<Set<string>> {
  const devices = await loadRuyiDevices();
  const supportedDirs = new Set<string>();

  if (devices.length === 0) {
    return supportedDirs;
  }

  const normalizedDeviceIds = new Set(devices.map((d) => normalizeName(d.id)));
  const normalizedDisplayNames = new Set(
    devices.map((d) => normalizeName(d.displayName)),
  );
  const rawDeviceIds = new Set(devices.map((d) => d.id.toLowerCase()));

  const aliasedDirs = new Set<string>();
  for (const [deviceId, dirs] of Object.entries(DEVICE_BOARD_ALIASES)) {
    if (rawDeviceIds.has(deviceId.toLowerCase())) {
      for (const dir of dirs) {
        aliasedDirs.add(dir);
      }
    }
  }

  for (const board of boards) {
    if (aliasedDirs.has(board.dir)) {
      supportedDirs.add(board.dir);
      continue;
    }

    const normProduct = normalizeName(board.product);
    const normVendorProduct = normalizeName(`${board.vendor} ${board.product}`);
    const normVendorDir = normalizeName(`${board.vendor}-${board.dir}`);
    const wchEvbId = `wch-${board.dir.toLowerCase()}-evb`;

    const isMatched =
      normalizedDisplayNames.has(normProduct) ||
      normalizedDisplayNames.has(normVendorProduct) ||
      normalizedDeviceIds.has(normVendorDir) ||
      normalizedDeviceIds.has(normVendorProduct) ||
      rawDeviceIds.has(wchEvbId);

    if (isMatched) {
      supportedDirs.add(board.dir);
    }
  }

  return supportedDirs;
}
