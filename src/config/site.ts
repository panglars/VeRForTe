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
  dark: "#0f172a",
};

export const statusClassMap: Record<string, string> = {
  GOOD: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 dark:ring-1 dark:ring-inset dark:ring-sky-400/30",
  BASIC:
    "bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-1 dark:ring-inset dark:ring-emerald-400/30",
  CFH: "bg-red-100 text-red-800 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-1 dark:ring-inset dark:ring-rose-400/30",
  CFT: "bg-gray-100 text-gray-800 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-1 dark:ring-inset dark:ring-slate-400/25",
  WIP: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:ring-1 dark:ring-inset dark:ring-fuchsia-400/30",
  CFI: "bg-yellow-100 text-yellow-800 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-1 dark:ring-inset dark:ring-amber-400/30",
  UNKNOWN:
    "bg-gray-100 text-gray-800 dark:bg-slate-400/15 dark:text-slate-300 dark:ring-1 dark:ring-inset dark:ring-slate-400/25",
};
