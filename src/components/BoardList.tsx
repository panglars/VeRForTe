// src/components/BoardList.tsx
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { SearchBar } from "./SearchBar";
import type { BoardData } from "../lib/data";

interface BoardListProps {
  boards: BoardData[];
}

/**
 * Component that displays a searchable list of development boards
 */
export function BoardList({ boards }: BoardListProps) {
  const [filteredBoards, setFilteredBoards] = useState<BoardData[]>(boards);

  /**
   * Handles search queries and filters the board list
   */
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredBoards(boards);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = boards.filter(
      (board) =>
        board.product.toLowerCase().includes(lowercaseQuery) ||
        board.cpu.toLowerCase().includes(lowercaseQuery) ||
        board.cpu_core.toLowerCase().includes(lowercaseQuery),
    );

    setFilteredBoards(filtered);
  };

  return (
    <div>
      <SearchBar onSearch={handleSearch} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBoards.map((board) => (
          <Card
            key={board.product}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle>
                <a
                  href={`/board/${encodeURIComponent(board.product)}`}
                  className="hover:underline"
                >
                  {board.product}
                </a>
              </CardTitle>
              <CardDescription>CPU: {board.cpu}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>CPU Core: {board.cpu_core}</p>
              <a
                href={`/board/${encodeURIComponent(board.product)}`}
                className="block mt-4 text-primary hover:underline"
              >
                View Details →
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBoards.length === 0 && (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">
            No boards found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  );
}
