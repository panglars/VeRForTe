import { useState } from "react";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";

export default function SearchBar({ boards }) {
  const [query, setQuery] = useState("");

const handleSearch = (e) => {
  const searchQuery = e.target.value;
  const cursorPos = e.target.selectionStart;
  setQuery(searchQuery);

  const cards = document.querySelectorAll(".board-card");
  const noResultsMessage = document.getElementById("no-results");

  const normalizedQuery = searchQuery.toLowerCase().trim()

  if (!normalizedQuery) {
    cards.forEach((card) => card.classList.remove("hidden"));
    if (noResultsMessage) noResultsMessage.classList.add("hidden");
    return;
  }

  let hasVisibleCards = false;

  cards.forEach((card) => {
    const product = card.getAttribute("data-product")?.toLowerCase() || "";
    const cpu = card.getAttribute("data-cpu")?.toLowerCase() || "";
    const cpuCore = card.getAttribute("data-cpu-core")?.toLowerCase() || "";

    const isMatch = [product, cpu, cpuCore].some(attr => 
      attr.includes(normalizedQuery)
    );

    if (isMatch) {
      card.classList.remove("hidden");
      hasVisibleCards = true;
    } else {
      card.classList.add("hidden");
    }
  });

  if (noResultsMessage) {
    noResultsMessage.classList.toggle("hidden", hasVisibleCards);
  }
};

  return (
    <div className="max-w-xl w-full mx-auto md:my-16 my-8">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <Input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search boards..."
          className="pl-12 py-6 w-full text-lg rounded-md border border-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          aria-label="Search boards"
          autoComplete="off"
        />
      </div>
    </div>
  );
}
