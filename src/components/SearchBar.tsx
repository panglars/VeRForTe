import { useState } from "react";
import { Input } from "./ui/input";
import { Search as SearchIcon } from "lucide-react";

export default function SearchBar({ boards }) {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    const searchQuery = e.target.value.toLowerCase().trim();
    setQuery(searchQuery);

    const cards = document.querySelectorAll(".board-card");

    if (!searchQuery) {
      cards.forEach((card) => {
        card.classList.remove("hidden");
      });

      const noResultsMessage = document.getElementById("no-results");
      if (noResultsMessage) {
        noResultsMessage.classList.add("hidden");
      }
      return;
    }

    let hasVisibleCards = false;

    cards.forEach((card) => {
      const product = card.getAttribute("data-product")?.toLowerCase() || "";
      const cpu = card.getAttribute("data-cpu")?.toLowerCase() || "";
      const cpuCore = card.getAttribute("data-cpu-core")?.toLowerCase() || "";

      if (
        product.includes(searchQuery) ||
        cpu.includes(searchQuery) ||
        cpuCore.includes(searchQuery)
      ) {
        card.classList.remove("hidden");
        hasVisibleCards = true;
      } else {
        card.classList.add("hidden");
      }
    });

    const noResultsMessage = document.getElementById("no-results");
    if (!hasVisibleCards && noResultsMessage) {
      noResultsMessage.classList.remove("hidden");
    } else if (noResultsMessage) {
      noResultsMessage.classList.add("hidden");
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
