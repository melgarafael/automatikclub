"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { useEffect } from "react";

interface TrackCatalogFiltersProps {
  activeCategory?: string;
  activeDifficulty?: string;
  searchQuery?: string;
}

const categories = ["Todos", "IA", "Programacao", "Design", "Negocios"];
const difficulties = [
  { value: "", label: "Todos" },
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediario" },
  { value: "advanced", label: "Avancado" },
];

export function TrackCatalogFilters({
  activeCategory,
  activeDifficulty,
  searchQuery,
}: TrackCatalogFiltersProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const [search, setSearch] = useState(searchQuery ?? "");
  const debouncedSearch = useDebounce(search, 300);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParamsHook.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/learn?${params.toString()}`);
    },
    [router, searchParamsHook]
  );

  useEffect(() => {
    if (debouncedSearch !== (searchQuery ?? "")) {
      updateParams("q", debouncedSearch);
    }
  }, [debouncedSearch, searchQuery, updateParams]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex w-full items-center gap-2 rounded-[2px] border-2 border-border bg-bg-inset px-3 py-2 font-mono text-[12px] text-text-1 transition-[border-color] duration-[80ms] focus-within:border-blue">
        <span className="font-semibold text-blue">&gt;_</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="buscar trilha..."
          className="flex-1 bg-transparent text-text-1 placeholder:text-text-3 focus:outline-none"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => {
          const value = cat === "Todos" ? "" : cat;
          const isActive =
            (cat === "Todos" && !activeCategory) ||
            activeCategory?.toLowerCase() === cat.toLowerCase();

          return (
            <button
              key={cat}
              onClick={() => updateParams("category", value)}
              className={`rounded-[2px] border-2 px-3 py-1.5 font-mono text-[11px] transition-all duration-[80ms] ${
                isActive
                  ? "border-blue bg-blue-dim text-blue"
                  : "border-border text-text-3 hover:border-border-hard hover:text-text-2"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Difficulty filter */}
      <div className="flex flex-wrap gap-1.5">
        {difficulties.map((diff) => {
          const isActive =
            (!diff.value && !activeDifficulty) ||
            activeDifficulty === diff.value;

          return (
            <button
              key={diff.value || "all"}
              onClick={() => updateParams("difficulty", diff.value)}
              className={`rounded-[2px] border-2 px-3 py-1.5 font-mono text-[11px] transition-all duration-[80ms] ${
                isActive
                  ? "border-blue bg-blue-dim text-blue"
                  : "border-border text-text-3 hover:border-border-hard hover:text-text-2"
              }`}
            >
              {diff.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TrackCatalogFilters;
