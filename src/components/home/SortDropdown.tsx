import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";

export interface SortOption {
  id: string;
  label: string;
  field: string;
  direction: "asc" | "desc";
  sortFn?: (a: any, b: any) => number;
}

interface SortDropdownProps {
  options: SortOption[];
  currentSort: SortOption;
  onSortChange: (option: SortOption) => void;
}

const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  currentSort,
  onSortChange,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center justify-between gap-2 min-w-48 w-auto"
        >
          <span className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
            <span>{currentSort.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onSortChange(option)}
            className="flex items-center justify-between gap-3 cursor-pointer"
          >
            <span>{option.label}</span>
            {option.id === currentSort.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
