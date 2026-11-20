import clsx from "clsx";
import { statusClassMap } from "@/config/site";
import type { ReportStatus } from "@/config/site";

interface StatusBadgeProps {
  status: ReportStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusClass = statusClassMap[status] ?? statusClassMap.UNKNOWN;

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold leading-5 tracking-wide",
        statusClass,
        className,
      )}
    >
      {status}
    </span>
  );
}
