"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/shared/utils";
import type { MarketplaceListing, ItemRarity, GachaItem } from "../types";
import { RARITY_ORDER } from "../types";
import { RarityBadge } from "./rarity-badge";
import { buyItemAction } from "../actions/buy-item";
import { cancelListingAction } from "../actions/cancel-listing";

interface MarketplaceGridProps {
  listings: MarketplaceListing[];
  myListings: MarketplaceListing[];
  userCredits: number;
  onPurchased?: () => void;
  onCancelled?: () => void;
  className?: string;
}

const CATEGORIES: GachaItem["category"][] = [
  "booster",
  "cosmetic",
  "perk",
  "asset",
  "external",
];

export function MarketplaceGrid({
  listings,
  myListings,
  userCredits,
  onPurchased,
  onCancelled,
  className,
}: MarketplaceGridProps) {
  const [tab, setTab] = useState<"browse" | "mine">("browse");
  const [rarityFilter, setRarityFilter] = useState<ItemRarity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<GachaItem["category"] | "all">("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  const filteredListings = useMemo(() => {
    const source = tab === "browse" ? listings : myListings;
    let result = [...source];

    if (rarityFilter !== "all") {
      result = result.filter((l) => l.item?.rarity === rarityFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((l) => l.item?.category === categoryFilter);
    }
    if (minPrice) {
      result = result.filter((l) => l.priceCredits >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((l) => l.priceCredits <= Number(maxPrice));
    }

    return result;
  }, [tab, listings, myListings, rarityFilter, categoryFilter, minPrice, maxPrice]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs */}
      <div className="flex gap-1 rounded-md border border-border bg-bg-2 p-0.5">
        <TabButton
          active={tab === "browse"}
          onClick={() => setTab("browse")}
          label={`Marketplace (${listings.length})`}
        />
        <TabButton
          active={tab === "mine"}
          onClick={() => setTab("mine")}
          label={`Minhas (${myListings.length})`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value as ItemRarity | "all")}
          className="rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Raridade"
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
          aria-label="Categoria"
        >
          <option value="all">Todas categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min preço"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="w-24 rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Preço mínimo"
        />
        <input
          type="number"
          placeholder="Max preço"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-24 rounded border border-border bg-bg-2 px-2 py-1.5 text-xs text-text-1"
          aria-label="Preço máximo"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isMine={tab === "mine"}
            userCredits={userCredits}
            onPurchased={onPurchased}
            onCancelled={onCancelled}
          />
        ))}

        {filteredListings.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-text-3">
            {tab === "browse"
              ? "Nenhuma listing encontrada"
              : "Você não tem listings"}
          </div>
        )}
      </div>
    </div>
  );
}

// -- Listing Card --

function ListingCard({
  listing,
  isMine,
  userCredits,
  onPurchased,
  onCancelled,
}: {
  listing: MarketplaceListing;
  isMine: boolean;
  userCredits: number;
  onPurchased?: () => void;
  onCancelled?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmBuy, setConfirmBuy] = useState(false);

  const rarity = listing.item?.rarity ?? "common";
  const canAfford = userCredits >= listing.priceCredits;

  const handleBuy = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await buyItemAction(listing.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setConfirmBuy(false);
    } else {
      onPurchased?.();
    }
  }, [listing.id, onPurchased]);

  const handleCancel = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await cancelListingAction(listing.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onCancelled?.();
    }
  }, [listing.id, onCancelled]);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border bg-bg-2 p-3"
      style={{ boxShadow: `var(--gacha-glow-${rarity})` }}
    >
      {/* Item info */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-xl"
          style={{
            background: `var(--gacha-${rarity}-dim)`,
            color: `var(--gacha-${rarity})`,
          }}
          aria-hidden="true"
        >
          ◆
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-1">
            {listing.item?.name ?? "Item"}
          </p>
          <RarityBadge rarity={rarity} showStars={false} className="mt-0.5 text-[8px]" />
        </div>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-3">Preço</span>
        <span className="font-mono text-sm font-semibold text-[--gacha-credits]">
          ● {listing.priceCredits.toLocaleString("pt-BR")}
        </span>
      </div>

      {/* Status for my listings */}
      {isMine && listing.status !== "active" && (
        <span className="text-xs capitalize text-text-3">
          Status: {listing.status}
        </span>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Actions */}
      {!isMine && listing.status === "active" && (
        <>
          {!confirmBuy ? (
            <button
              onClick={() => setConfirmBuy(true)}
              disabled={!canAfford || loading}
              className={cn(
                "w-full rounded py-1.5 text-xs font-medium transition-colors",
                canAfford
                  ? "bg-[--gacha-credits]/20 text-[--gacha-credits] hover:bg-[--gacha-credits]/30"
                  : "cursor-not-allowed bg-bg-3 text-text-3"
              )}
            >
              {canAfford ? "Comprar" : "Créditos insuficientes"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmBuy(false)}
                className="flex-1 rounded border border-border py-1.5 text-xs text-text-2 hover:bg-bg-3"
              >
                Cancelar
              </button>
              <button
                onClick={handleBuy}
                disabled={loading}
                className="flex-1 rounded bg-[--gacha-credits]/20 py-1.5 text-xs font-medium text-[--gacha-credits] hover:bg-[--gacha-credits]/30 disabled:opacity-50"
              >
                {loading ? "Comprando..." : "Confirmar"}
              </button>
            </div>
          )}
        </>
      )}

      {isMine && listing.status === "active" && (
        <button
          onClick={handleCancel}
          disabled={loading}
          className="w-full rounded border border-border py-1.5 text-xs text-text-2 hover:bg-bg-3 disabled:opacity-50"
        >
          {loading ? "Cancelando..." : "Cancelar Listing"}
        </button>
      )}
    </div>
  );
}

// -- Tab Button --

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-bg-1 text-text-1 shadow-sm"
          : "text-text-3 hover:text-text-2"
      )}
    >
      {label}
    </button>
  );
}
