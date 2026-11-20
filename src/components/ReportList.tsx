import { reportTableFeatures } from "@/lib/table-features";
import React, { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  useTable,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, ChevronsUpDown, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import type { ReportMetaData } from "@/lib/data";
import { useTranslations, getRelativeUrl, type LocaleCode } from "@/i18n/utils";
import { statusClassMap } from "@/config/site";
import { endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import clsx from "clsx";

// Enhanced interface for enriched report data
interface EnrichedReport extends ReportMetaData {
  boardProduct: string;
  cpu: string;
  vendor: string;
  systemDisplayName: string;
}

interface MultiSelectComboboxProps {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  lang: LocaleCode;
}

function MultiSelectCombobox({
  options = [],
  values,
  onChange,
  placeholder,
  lang,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [buttonWidth, setButtonWidth] = useState(0);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const t = useTranslations(lang);

  // Update button width when component mounts or resizes
  React.useEffect(() => {
    const updateWidth = () => {
      if (buttonRef.current) {
        setButtonWidth(buttonRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const selectedLabels = values.map(
    (value) => options.find((option) => option.value === value)?.label || value,
  );

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10"
          >
            <span className="truncate">
              {values.length > 0
                ? `${values.length} ${t("reports.selected")}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          align="start"
          style={{ width: buttonWidth ? `${buttonWidth}px` : "auto" }}
        >
          <Command>
            <CommandInput placeholder={t("reports.search_options")} />
            <CommandList>
              <CommandEmpty>{t("no_results")}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label]}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        values.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected items as removable badges */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label, index) => {
            const val = values[index];
            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-xs gap-1 pr-1"
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  aria-label={`Remove ${label}`}
                  className="rounded-full hover:bg-foreground/15 p-0.5 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Status cell component
const StatusCell = ({ status }: { status: string }) => {
  const statusClass = statusClassMap[status] ?? statusClassMap.UNKNOWN;

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-md font-semibold text-xs ${statusClass}`}
    >
      {status}
    </span>
  );
};

const COLUMN_RESPONSIVE_CLASS: Record<string, string> = {
  cpu: "hidden md:table-cell",
  sys_ver: "hidden lg:table-cell",
  sys_var: "hidden lg:table-cell",
};

// Main component interface
interface ReportListProps {
  lang: LocaleCode;
  reports: EnrichedReport[];
  systemMetadata: Record<string, string>;
}

// Main component
export default function ReportList({
  lang,
  reports,
  systemMetadata,
}: ReportListProps) {
  const t = useTranslations(lang);

  // State management - changed to arrays for multi-select
  const [sorting, setSorting] = useState<SortingState>([
    { id: "last_update", desc: true }, // Default: latest reports first
  ]);
  const [cpuFilters, setCpuFilters] = useState<string[]>([]);
  const [vendorFilters, setVendorFilters] = useState<string[]>([]);
  const [systemFilters, setSystemFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Create column helper
  const columnHelper = createColumnHelper<
    typeof reportTableFeatures,
    EnrichedReport
  >();

  // Build table columns with responsive visibility
  const columns = useMemo(
    () =>
      columnHelper.columns([
        // Board Product - always visible
        columnHelper.accessor("boardProduct", {
          header: t("reports.header.board"),
          size: 140,
          minSize: 100,
          maxSize: 180,
          cell: (info) => {
            const report = info.row.original;
            const url = getRelativeUrl(
              lang,
              `reports/${report.boardId}-${report.systemDir || report.sys}-${report.fileName}`,
            );
            return (
              <a
                href={url}
                className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
              >
                {info.getValue()}
              </a>
            );
          },
        }),
        // CPU - hidden on mobile
        columnHelper.accessor("cpu", {
          header: t("reports.header.cpu"),
          size: 90,
          minSize: 80,
          maxSize: 120,
          cell: (info) => (
            <span className="text-sm text-muted-foreground">
              {info.getValue()}
            </span>
          ),
        }),
        // Vendor - always visible
        columnHelper.accessor("vendor", {
          header: t("reports.header.vendor"),
          size: 90,
          minSize: 80,
          maxSize: 120,
          cell: (info) => <span className="text-sm">{info.getValue()}</span>,
        }),
        // System Display Name - always visible
        columnHelper.accessor("systemDisplayName", {
          header: t("reports.header.system"),
          size: 110,
          minSize: 80,
          maxSize: 130,
          cell: (info) => (
            <span className="font-medium">{info.getValue()}</span>
          ),
        }),
        // Version - hidden on smaller viewports
        columnHelper.accessor("sys_ver", {
          header: t("reports.header.version"),
          size: 100,
          minSize: 80,
          maxSize: 160,
          cell: (info) => (
            <span className="text-sm text-muted-foreground">
              {info.getValue() || "-"}
            </span>
          ),
        }),
        // Variant - hidden on smaller viewports
        columnHelper.accessor("sys_var", {
          header: t("reports.header.variant"),
          size: 90,
          minSize: 60,
          maxSize: 130,
          cell: (info) => (
            <span className="text-sm text-muted-foreground">
              {info.getValue() || "-"}
            </span>
          ),
        }),
        // Status - always visible
        columnHelper.accessor("status", {
          header: t("reports.header.status"),
          size: 70,
          minSize: 60,
          maxSize: 100,
          cell: (info) => <StatusCell status={info.getValue()} />,
        }),
        // Last Update - always visible
        columnHelper.accessor("last_update", {
          header: t("reports.header.updated"),
          size: 90,
          minSize: 70,
          maxSize: 110,
          cell: (info) => {
            const date = info.getValue();
            return (
              <span className="text-sm text-muted-foreground">
                {date ? format(date, "MMM dd, yyyy") : "-"}
              </span>
            );
          },
        }),
      ]),
    [lang, t],
  );

  // Prepare filtered data
  const filteredData = useMemo(() => {
    return reports.filter((report) => {
      if (cpuFilters.length > 0 && !cpuFilters.includes(report.cpu))
        return false;

      if (vendorFilters.length > 0 && !vendorFilters.includes(report.vendor))
        return false;

      if (systemFilters.length > 0 && !systemFilters.includes(report.sys))
        return false;

      if (statusFilters.length > 0 && !statusFilters.includes(report.status))
        return false;

      if (dateRange?.from) {
        if (!report.last_update) return false;
        const reportDate = report.last_update;
        const from = startOfDay(dateRange.from);
        if (dateRange.to) {
          const to = endOfDay(dateRange.to);
          if (!isWithinInterval(reportDate, { start: from, end: to })) {
            return false;
          }
        } else if (reportDate < from) {
          return false;
        }
      }

      return true;
    });
  }, [
    reports,
    cpuFilters,
    vendorFilters,
    systemFilters,
    statusFilters,
    dateRange,
  ]);

  // Create table instance
  const table = useTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    features: reportTableFeatures,
  });

  // Prepare filter options
  const cpuOptions = useMemo(() => {
    const uniqueCpus = [...new Set(reports.map((r) => r.cpu))].sort();
    return uniqueCpus.map((cpu) => ({ label: cpu, value: cpu }));
  }, [reports]);

  const vendorOptions = useMemo(() => {
    const uniqueVendors = [...new Set(reports.map((r) => r.vendor))].sort();
    return uniqueVendors.map((vendor) => ({ label: vendor, value: vendor }));
  }, [reports]);

  // Use metadata.yml for system options instead of extracting from reports
  const systemOptions = useMemo(() => {
    const systems = Object.entries(systemMetadata)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return systems.map((sys) => ({
      label: sys.name,
      value: sys.id,
    }));
  }, [systemMetadata]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(reports.map((r) => r.status))].sort();
    return uniqueStatuses.map((status) => ({ label: status, value: status }));
  }, [reports]);

  const hasActiveFilters = Boolean(
    cpuFilters.length > 0 ||
      vendorFilters.length > 0 ||
      systemFilters.length > 0 ||
      statusFilters.length > 0 ||
      dateRange?.from,
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MultiSelectCombobox
          placeholder={t("reports.select_cpus")}
          options={cpuOptions}
          values={cpuFilters}
          onChange={setCpuFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder={t("reports.select_vendors")}
          options={vendorOptions}
          values={vendorFilters}
          onChange={setVendorFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder={t("reports.select_systems")}
          options={systemOptions}
          values={systemFilters}
          onChange={setSystemFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder={t("reports.select_statuses")}
          options={statusOptions}
          values={statusFilters}
          onChange={setStatusFilters}
          lang={lang}
        />
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          placeholder={t("reports.select_date_range")}
          className="md:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("reports.showing_results")
            .replace("{filtered}", filteredData.length.toString())
            .replace("{total}", reports.length.toString())}
        </p>

        {/* Clear filters button */}
        <Button
          variant="outline"
          size="sm"
          disabled={!hasActiveFilters}
          onClick={() => {
            setCpuFilters([]);
            setVendorFilters([]);
            setSystemFilters([]);
            setStatusFilters([]);
            setDateRange(undefined);
          }}
        >
          {t("reports.clear_filters")}
        </Button>
      </div>

      {/* Data table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-x-auto shadow-xs">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={clsx(
                      header.column.getCanSort() &&
                        "cursor-pointer select-none hover:bg-muted/50",
                      COLUMN_RESPONSIVE_CLASS[header.column.id],
                    )}
                    style={{ width: `${header.getSize()}px` }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {{
                        asc: <ArrowUp className="h-4 w-4 text-primary" />,
                        desc: <ArrowDown className="h-4 w-4 text-primary" />,
                      }[header.column.getIsSorted() as string] || null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("a")) return;
                    const report = row.original;
                    const url = getRelativeUrl(
                      lang,
                      `reports/${report.boardId}-${report.systemDir || report.sys}-${report.fileName}`,
                    );
                    if (e.metaKey || e.ctrlKey) {
                      window.open(url, "_blank", "noopener,noreferrer");
                      return;
                    }
                    window.location.href = url;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={clsx(
                        COLUMN_RESPONSIVE_CLASS[cell.column.id],
                      )}
                      style={{ width: `${cell.column.getSize()}px` }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <p className="text-muted-foreground">
                      {t("reports.no_reports_found")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("reports.try_adjusting_filters")}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
