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
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        statusClass,
        className,
      )}
    >
      {status}
    </span>
  );
}
