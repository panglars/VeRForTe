import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

/**
 * Search bar component with real-time filtering
 * @param onSearch Callback function to handle search queries
 * @param placeholder Optional placeholder text for the input
 */
export function SearchBar({
  onSearch,
  placeholder = "Search boards...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  // Trigger search when query changes
  useEffect(() => {
    // Debounce search to avoid too many updates
    const timer = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <div className="relative max-w-md w-full mx-auto mb-8">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        aria-label="Search boards"
      />
    </div>
  );
}
