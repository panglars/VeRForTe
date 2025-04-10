import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ArrowDownWideNarrow, ChevronDown } from "lucide-react";

interface SortOption {
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
  const handleSortChange = (option: SortOption) => {
    onSortChange(option);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 w-48">
          <ArrowDownWideNarrow className="h-4 w-4" />
          <span>{currentSort.label}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handleSortChange(option)}
            className="flex items-center justify-between"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
