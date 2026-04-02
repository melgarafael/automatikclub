"use client";

import type { Book } from "../types";
import { BookCard } from "./book-card";
import { EmptyState } from "@/shared/components/empty-state";
import { useState } from "react";

interface BookGridProps {
  books: Book[];
  availableTags: string[];
}

export function BookGrid({ books, availableTags }: BookGridProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Filter books
  let filtered = books;

  if (selectedTags.length > 0) {
    filtered = filtered.filter((book) =>
      selectedTags.some((tag) => book.tags.includes(tag))
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        book.author_name?.toLowerCase().includes(q) ||
        book.description?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por titulo, autor ou descricao..."
        className="w-full rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 text-[14px] text-text-1 placeholder:text-text-3 focus:border-blue focus:outline-none"
      />

      {/* Tag filters */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-[2px] border-2 px-2.5 py-1 font-mono text-[11px] transition-colors ${
                selectedTags.includes(tag)
                  ? "border-blue bg-blue/10 text-blue"
                  : "border-border text-text-3 hover:border-text-3 hover:text-text-2"
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="rounded-[2px] px-2 py-1 font-mono text-[11px] text-text-3 hover:text-text-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum livro encontrado"
          description={
            search || selectedTags.length > 0
              ? "Tente alterar os filtros ou a busca."
              : "Livros recomendados aparecerao aqui."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BookGrid;
