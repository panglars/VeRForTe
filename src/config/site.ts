export const siteConfig = {
  url: "https://matrix.ruyisdk.org",
  title: "RISC-V Board and OS Support Matrix",
  title_zh: "RISC-V 开发板和操作系统支持矩阵",
  links: {
    github: "https://github.com/ruyisdk/support-matrix",
    ruyisdk: "https://ruyisdk.org/",
  },
};

export type SiteConfig = typeof siteConfig;

export type ReportStatus = "GOOD" | "BASIC" | "CFH" | "CFI" | "CFT" | "WIP";

export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

export const statusClassMap: Record<string, string> = {
  GOOD: "bg-sky-100 text-sky-800 dark:bg-sky-800 dark:text-sky-100",
  BASIC: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
  CFH: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
  CFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  WIP: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-800 dark:text-fuchsia-100",
  CFI: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  UNKNOWN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};
