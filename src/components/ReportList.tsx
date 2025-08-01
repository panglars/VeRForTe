import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
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
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { getRelativeLocaleUrl } from "astro:i18n";
import { useTranslations } from "@/i18n/utils";
import { statusClassMap } from "@/config/site";
import { format, isWithinInterval } from "date-fns";
import type { DateRange } from "react-day-picker";

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
  lang: string;
}

function MultiSelectCombobox({
  options = [],
  values,
  onChange,
  placeholder,
  lang,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations(lang);

  const selectedLabels = values.map(value => 
    options.find(option => option.value === value)?.label || value
  );

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter(v => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-10"
          >
            <span className="truncate">
              {values.length > 0 ? `${values.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>{t("no_results")}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        values.includes(option.value) ? "opacity-100" : "opacity-0"
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
      
      {/* Selected items as badges */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label, index) => (
            <Badge
              key={values[index]}
              variant="secondary"
              className="text-xs"
            >
              {label}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(values[index])}
              />
            </Badge>
          ))}
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
      className={`inline-block px-2 py-1 rounded-md font-medium text-xs ${statusClass}`}
    >
      {status}
    </span>
  );
};

// Main component interface
interface ReportListProps {
  lang: string;
  reports: EnrichedReport[];
  systemMetadata: Record<string, string>;
}

// Main component
export default function ReportList({ lang, reports, systemMetadata }: ReportListProps) {
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
  const columnHelper = createColumnHelper<EnrichedReport>();

  // Build table columns with responsive design
  const columns = useMemo(
    () => [
      // Board Product - always visible
      columnHelper.accessor("boardProduct", {
        header: "Board",
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        ),
      }),
      // CPU - hidden on mobile
      columnHelper.accessor("cpu", {
        header: "CPU",
        cell: (info) => (
          <div className="hidden md:block text-sm text-muted-foreground">
            {info.getValue()}
          </div>
        ),
      }),
      // Vendor - always visible
      columnHelper.accessor("vendor", {
        header: "Vendor",
        cell: (info) => (
          <div className="text-sm">{info.getValue()}</div>
        ),
      }),
      // System Display Name - always visible
      columnHelper.accessor("systemDisplayName", {
        header: "System",
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        ),
      }),
      // Version - hidden on mobile
      columnHelper.accessor("sys_ver", {
        header: "Version",
        cell: (info) => (
          <div className="hidden lg:block text-sm text-muted-foreground">
            {info.getValue() || "-"}
          </div>
        ),
      }),
      // Variant - hidden on mobile
      columnHelper.accessor("sys_var", {
        header: "Variant",
        cell: (info) => (
          <div className="hidden lg:block text-sm text-muted-foreground">
            {info.getValue() || "-"}
          </div>
        ),
      }),
      // Status - always visible
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusCell status={info.getValue()} />,
      }),
      // Last Update - always visible
      columnHelper.accessor("last_update", {
        header: "Updated",
        cell: (info) => {
          const date = info.getValue();
          return (
            <div className="text-sm text-muted-foreground">
              {date ? format(date, "MMM dd, yyyy") : "-"}
            </div>
          );
        },
      }),
    ],
    [lang]
  );

  // Prepare filtered data
  const filteredData = useMemo(() => {
    return reports.filter((report) => {
      // CPU filters - if array is not empty, report.cpu must be in the array
      if (cpuFilters.length > 0 && !cpuFilters.includes(report.cpu)) return false;

      // Vendor filters
      if (vendorFilters.length > 0 && !vendorFilters.includes(report.vendor)) return false;

      // System filters
      if (systemFilters.length > 0 && !systemFilters.includes(report.sys)) return false;

      // Status filters
      if (statusFilters.length > 0 && !statusFilters.includes(report.status)) return false;

      // Date range filter
      if (dateRange?.from && dateRange?.to && report.last_update) {
        const reportDate = report.last_update;
        if (!isWithinInterval(reportDate, { start: dateRange.from, end: dateRange.to })) {
          return false;
        }
      }

      return true;
    });
  }, [reports, cpuFilters, vendorFilters, systemFilters, statusFilters, dateRange]);

  // Create table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
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
    // Create a flat list of all systems from metadata.yml
    const systems = Object.entries(systemMetadata)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return systems.map((sys) => ({ 
      label: sys.name, 
      value: sys.id 
    }));
  }, [systemMetadata]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = [...new Set(reports.map((r) => r.status))].sort();
    return uniqueStatuses.map((status) => ({ label: status, value: status }));
  }, [reports]);

  // Check if any filters are active
  const hasActiveFilters = cpuFilters.length > 0 || vendorFilters.length > 0 || 
                          systemFilters.length > 0 || statusFilters.length > 0 || dateRange;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MultiSelectCombobox
          placeholder="Select CPUs"
          options={cpuOptions}
          values={cpuFilters}
          onChange={setCpuFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder="Select Vendors"
          options={vendorOptions}
          values={vendorFilters}
          onChange={setVendorFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder="Select Systems"
          options={systemOptions}
          values={systemFilters}
          onChange={setSystemFilters}
          lang={lang}
        />
        <MultiSelectCombobox
          placeholder="Select Status"
          options={statusOptions}
          values={statusFilters}
          onChange={setStatusFilters}
          lang={lang}
        />
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
          placeholder="Select date range"
          className="md:col-span-2 lg:col-span-1"
        />
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {reports.length} test reports
        </p>
        
        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCpuFilters([]);
              setVendorFilters([]);
              setSystemFilters([]);
              setStatusFilters([]);
              setDateRange(undefined);
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Data table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${
                      header.column.getCanSort() 
                        ? "cursor-pointer select-none hover:bg-muted/50" 
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <span className="text-primary">↑</span>,
                        desc: <span className="text-primary">↓</span>,
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
                  onClick={() => {
                    const report = row.original;
                    const url = getRelativeLocaleUrl(
                      lang,
                      `reports/${report.boardId}-${report.sys}-${report.fileName}`,
                      { normalizeLocale: false }
                    );
                    window.location.href = url;
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
                    <p className="text-muted-foreground">No test reports found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters
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