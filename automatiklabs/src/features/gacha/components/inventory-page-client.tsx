"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem, UserWallet } from "../types";
import { CurrencyDisplay } from "./currency-display";
import { InventoryGrid } from "./inventory-grid";
import { ItemDetailModal } from "./item-detail-modal";
import { FusionPanel } from "./fusion-panel";
import { CollectionTracker } from "./collection-tracker";

type Tab = "inventory" | "collection" | "fusion";

interface InventoryPageClientProps {
  initialItems: InventoryItem[];
  wallet: UserWallet;
  collection: {
    owned: number;
    total: number;
    byCategory: Record<string, { owned: number; total: number }>;
  };
}

export function InventoryPageClient({
  initialItems,
  wallet,
  collection,
}: InventoryPageClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("inventory");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [fusionItem, setFusionItem] = useState<InventoryItem | undefined>(
    undefined
  );

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleFuseRequest = useCallback((item: InventoryItem) => {
    setSelectedItem(null);
    setFusionItem(item);
    setTab("fusion");
  }, []);

  return (
    <div className="space-y-5">
      {/* Currency */}
      <CurrencyDisplay fragments={wallet.fragments} credits={wallet.credits} />

      {/* Tabs */}
      <div className="flex gap-1 rounded-md border border-border bg-bg-2 p-0.5">
        {(
          [
            ["inventory", "Inventário"],
            ["collection", "Coleção"],
            ["fusion", "Fusão"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? "bg-bg-1 text-text-1 shadow-sm"
                : "text-text-3 hover:text-text-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "inventory" && (
        <InventoryGrid
          items={initialItems}
          onItemClick={setSelectedItem}
        />
      )}

      {tab === "collection" && (
        <CollectionTracker
          owned={collection.owned}
          total={collection.total}
          byCategory={collection.byCategory}
        />
      )}

      {tab === "fusion" && (
        <FusionPanel
          inventory={initialItems.filter((i) => !i.isLocked)}
          preselectedItem={fusionItem}
          onFused={refresh}
          onClose={() => {
            setTab("inventory");
            setFusionItem(undefined);
          }}
        />
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onRecycled={refresh}
        onListed={refresh}
        onFuseRequest={handleFuseRequest}
      />
    </div>
  );
}
