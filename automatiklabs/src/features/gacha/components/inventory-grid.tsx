"use client";

import { useState, useMemo } from "react";
import { cn } from "@/shared/utils";
import type { InventoryItem, ItemRarity, GachaItem } from "../types";
import { RarityBadge } from "./rarity-badge";
import { RARITY_ORDER } from "../types";

// -- Types --

type SortField = "rarity" | "name" | "date";

interface InventoryGridProps {
  items: InventoryItem[];
  onItemClick?: (item: InventoryItem) => void;
  className?: string;
}

const CATEGORIES: GachaItem["category"][] = [
  "booster",
  "cosmetic",
  "perk",
  "asset",
  "external",
];

const CATEGORY_LABELS: Record<GachaItem["category"], string> = {
  booster: "Boosters",
  cosmetic: "Cosméticos",
  perk: "Perks",
  asset: "Assets",
  external: "Externos",
};

// -- Component --

export function InventoryGrid({
  items,
  onItemClick,
  className,
}: InventoryGridProps) {
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<
    GachaItem["category"] | "all"
  >("all");
  const [lockedFilter, setLockedFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [sortField, setSortField] = useState<SortField>("rarity");

  const filtered = useMemo(() => {
    let result = [...items];

    if (rarityFilter !== "all") {
      result = result.filter((i) => i.item?.rarity === rarityFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((i) => i.item?.category === categoryFilter);
    }
    if (lockedFilter === "locked") {
      result = result.filter((i) => i.isLocked);
    } else if (lockedFilter === "unlocked") {
      result = result.filter((i) => !i.isLocked);
    }

    const rarityIndex = Object.fromEntries(
      RARITY_ORDER.map((r, i) => [r, i])
    );

    result.sort((a, b) => {
      switch (sortField) {
        case "rarity":
          return (
            (rarityIndex[b.item?.rarity ?? "common"] ?? 0) -
            (rarityIndex[a.item?.rarity ?? "common"] ?? 0)
          );
        case "name":
          return (a.item?.name ?? "").localeCompare(b.item?.name ?? "");
        case "date":
          return (
            new Date(b.obtainedAt).getTime() -
            new Date(a.obtainedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return result;
  }, [items, rarityFilter, categoryFilter, lockedFilter, sortField]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value as ItemRarity | "all")}
          className="rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Filtrar por raridade"
        >
          <option value="all">Todas raridades</option>
          {RARITY_ORDER.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as GachaItem["category"] | "all")
          }
          className="rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Filtrar por categoria"
        >
          <option value="all">Todas categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>

        <select
          value={lockedFilter}
          onChange={(e) =>
            setLockedFilter(e.target.value as "all" | "unlocked" | "locked")
          }
          className="rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos</option>
          <option value="unlocked">Disponíveis</option>
          <option value="locked">Bloqueados</option>
        </select>

        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Ordenar por"
        >
          <option value="rarity">Raridade</option>
          <option value="name">Nome</option>
          <option value="date">Data</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-xs text-text-2">
        {filtered.length} {filtered.length === 1 ? "item" : "itens"}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {filtered.map((inv) => (
          <ItemCard
            key={inv.id}
            item={inv}
            onClick={() => onItemClick?.(inv)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-text-3">
            Nenhum item encontrado
          </div>
        )}
      </div>
    </div>
  );
}

// -- Item Card --

function ItemCard({
  item,
  onClick,
}: {
  item: InventoryItem;
  onClick: () => void;
}) {
  const rarity = item.item?.rarity ?? "common";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-md border p-2 text-left transition-all",
        "border-border bg-bg-2 hover:bg-bg-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      )}
      style={{
        boxShadow: `var(--gacha-glow-${rarity})`,
      }}
      aria-label={`${item.item?.name ?? "Item"} — ${rarity}`}
    >
      {/* Icon placeholder */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded text-2xl sm:h-14 sm:w-14"
        style={{
          background: `var(--gacha-${rarity}-dim)`,
          color: `var(--gacha-${rarity})`,
        }}
        aria-hidden="true"
      >
        {item.item?.iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.item.iconUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          "◆"
        )}
      </div>

      {/* Name */}
      <span className="line-clamp-1 w-full text-center text-[11px] font-medium text-text-1">
        {item.item?.name ?? "???"}
      </span>

      {/* Rarity badge */}
      <RarityBadge rarity={rarity} showStars={false} className="text-[8px]" />

      {/* Lock indicator */}
      {item.isLocked && (
        <span
          className="absolute right-1 top-1 text-[10px] text-text-3"
          title="Item bloqueado (listado no marketplace)"
          aria-label="Bloqueado"
        >
          🔒
        </span>
      )}

      {/* Binding type */}
      {item.item?.bindType === "soulbound" && (
        <span
          className="absolute left-1 top-1 text-[10px] text-text-3"
          title="Soulbound — não pode ser vendido"
          aria-label="Soulbound"
        >
          ⛓
        </span>
      )}
    </button>
  );
}
