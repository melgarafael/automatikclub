"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import type { ItemType, SortOption } from "../types";

const ITEM_TYPES: { value: ItemType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "skill", label: "Skills" },
  { value: "github_project", label: "GitHub" },
  { value: "template", label: "Templates" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Mais recentes" },
  { value: "top_rated", label: "Melhor avaliados" },
  { value: "most_downloaded", label: "Mais baixados" },
];

const POPULAR_TAGS = ["ai", "dev", "design", "marketing", "productivity", "data"];

export function MarketplaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentType = searchParams.get("type") || "all";
  const currentSort = (searchParams.get("sort") || "recent") as SortOption;
  const currentSearch = searchParams.get("q") || "";
  const currentMinRating = searchParams.get("minRating") || "";
  const currentTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset page on filter change
      params.delete("page");
      router.push(`/marketplace?${params.toString()}`);
    },
    [searchParams, router]
  );

  const toggleTag = useCallback(
    (tag: string) => {
      const next = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      updateParams({ tags: next.length > 0 ? next.join(",") : null });
    },
    [currentTags, updateParams]
  );

  return (
    <aside className="space-y-6">
      {/* Search */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Buscar
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParams({ q: (fd.get("q") as string) || null });
          }}
        >
          <Input
            name="q"
            placeholder="Buscar itens..."
            defaultValue={currentSearch}
          />
        </form>
      </div>

      {/* Type filter */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Tipo
        </label>
        <div className="flex flex-wrap gap-[4px]">
          {ITEM_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => updateParams({ type: t.value })}
              className={`rounded-[2px] border-2 px-[10px] py-[4px] font-mono text-[11px] font-medium transition-all duration-[80ms] ${
                currentType === t.value
                  ? "border-blue bg-blue-dim text-blue"
                  : "border-border bg-transparent text-text-2 hover:border-blue/50 hover:text-text-1"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Ordenar por
        </label>
        <div className="flex flex-col gap-[2px]">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => updateParams({ sort: s.value === "recent" ? null : s.value })}
              className={`rounded-[2px] px-[8px] py-[5px] text-left text-[13px] transition-all duration-[80ms] ${
                currentSort === s.value
                  ? "bg-bg-hover font-medium text-text-1"
                  : "text-text-2 hover:bg-bg-hover hover:text-text-1"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Min rating */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Rating minimo
        </label>
        <div className="flex gap-[4px]">
          {[0, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() =>
                updateParams({ minRating: r === 0 ? null : String(r) })
              }
              className={`rounded-[2px] border-2 px-[8px] py-[3px] font-mono text-[11px] transition-all duration-[80ms] ${
                (currentMinRating === "" && r === 0) ||
                currentMinRating === String(r)
                  ? "border-amber bg-[rgba(240,160,48,0.12)] text-amber"
                  : "border-border text-text-2 hover:border-amber/50"
              }`}
            >
              {r === 0 ? "Todos" : `${r}+`}
              {r > 0 && <span className="ml-[2px] text-amber">{"\u2605"}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-text-3">
          Tags
        </label>
        <div className="flex flex-wrap gap-[4px]">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-[2px] border px-[6px] py-[2px] font-mono text-[10px] transition-all duration-[80ms] ${
                currentTags.includes(tag)
                  ? "border-blue bg-blue-dim text-blue"
                  : "border-border bg-bg-inset text-text-3 hover:border-blue/50 hover:text-text-2"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {(currentType !== "all" ||
        currentSearch ||
        currentMinRating ||
        currentTags.length > 0 ||
        currentSort !== "recent") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/marketplace")}
          className="w-full"
        >
          Limpar filtros
        </Button>
      )}
    </aside>
  );
}

export default MarketplaceFilters;
