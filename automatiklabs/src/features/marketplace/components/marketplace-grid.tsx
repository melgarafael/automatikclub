"use client";

import { MarketplaceCard } from "./marketplace-card";
import { EmptyState } from "@/shared/components/empty-state";
import type { MarketplaceItemWithAuthor } from "../types";

interface MarketplaceGridProps {
  items: MarketplaceItemWithAuthor[];
}

export function MarketplaceGrid({ items }: MarketplaceGridProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum item encontrado"
        description="Tente ajustar os filtros ou faca uma busca diferente."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <MarketplaceCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export default MarketplaceGrid;
