"use client";

import { useState, useCallback } from "react";
import { cn } from "@/shared/utils";
import type { InventoryItem, ItemRarity } from "../types";
import { RARITY_ORDER } from "../types";
import { RarityBadge } from "./rarity-badge";
import { fuseItemsAction } from "../actions/fuse";

interface FusionPanelProps {
  inventory: InventoryItem[];
  onFused?: () => void;
  onClose?: () => void;
  preselectedItem?: InventoryItem;
  className?: string;
}

const NEXT_RARITY: Partial<Record<ItemRarity, ItemRarity>> = {
  common: "uncommon",
  uncommon: "rare",
  rare: "epic",
  epic: "legendary",
};

export function FusionPanel({
  inventory,
  onFused,
  onClose,
  preselectedItem,
  className,
}: FusionPanelProps) {
  const [slots, setSlots] = useState<(InventoryItem | null)[]>(() => {
    if (preselectedItem) return [preselectedItem, null, null];
    return [null, null, null];
  });
  const [result, setResult] = useState<{
    name: string;
    rarity: ItemRarity;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"select" | "fusing" | "done">("select");

  // Determine the active rarity from first selected slot
  const activeRarity = slots[0]?.item?.rarity ?? null;

  // Eligible items: same rarity, not locked, not already in slots
  const selectedIds = new Set(slots.filter(Boolean).map((s) => s!.id));
  const eligible = inventory.filter(
    (inv) =>
      !inv.isLocked &&
      !selectedIds.has(inv.id) &&
      (activeRarity ? inv.item?.rarity === activeRarity : true) &&
      inv.item?.rarity !== "legendary"
  );

  const outputRarity = activeRarity ? NEXT_RARITY[activeRarity] : null;
  const canFuse = slots.every(Boolean) && outputRarity;

  const selectSlot = useCallback(
    (slotIndex: number, item: InventoryItem) => {
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = item;
        return next;
      });
      setError(null);
    },
    []
  );

  const clearSlot = useCallback((slotIndex: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  }, []);

  async function handleFuse() {
    if (!canFuse) return;
    const ids = slots.map((s) => s!.id) as [string, string, string];

    setLoading(true);
    setError(null);
    setPhase("fusing");

    const res = await fuseItemsAction(ids);

    setLoading(false);
    if (res.error) {
      setError(res.error);
      setPhase("select");
    } else if (res.result) {
      setResult({
        name: res.result.outputItem.item?.name ?? "Novo item",
        rarity: res.result.outputRarity,
      });
      setPhase("done");
    }
  }

  return (
    <div className={cn("space-y-5 rounded-lg border border-border bg-bg-1 p-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-1">Fusão</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-text-3 hover:text-text-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Slots */}
      {phase !== "done" && (
        <>
          <div className="flex items-center justify-center gap-3">
            {slots.map((slot, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed transition-all",
                    slot
                      ? "border-solid"
                      : "border-border text-text-3"
                  )}
                  style={
                    slot
                      ? {
                          borderColor: `var(--gacha-${slot.item?.rarity ?? "common"})`,
                          background: `var(--gacha-${slot.item?.rarity ?? "common"}-dim)`,
                          boxShadow: `var(--gacha-glow-${slot.item?.rarity ?? "common"})`,
                        }
                      : undefined
                  }
                >
                  {slot ? (
                    <button
                      onClick={() => clearSlot(i)}
                      className="flex h-full w-full items-center justify-center text-xl"
                      style={{ color: `var(--gacha-${slot.item?.rarity ?? "common"})` }}
                      aria-label={`Remover ${slot.item?.name}`}
                    >
                      ◆
                    </button>
                  ) : (
                    <span className="text-xs">Slot {i + 1}</span>
                  )}
                </div>
                {slot && (
                  <span className="max-w-[64px] truncate text-[10px] text-text-2">
                    {slot.item?.name}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Arrow + output preview */}
          {activeRarity && outputRarity && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg text-text-3" aria-hidden="true">
                ↓
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-2">Resultado:</span>
                <RarityBadge rarity={outputRarity} />
              </div>
            </div>
          )}

          {/* Eligible items picker */}
          {slots.some((s) => !s) && (
            <div>
              <p className="mb-2 text-xs text-text-3">
                Selecione itens {activeRarity ? `${activeRarity}` : "(mesma raridade, não Legendary)"}:
              </p>
              <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6">
                {eligible.map((inv) => {
                  const emptySlotIdx = slots.findIndex((s) => !s);
                  return (
                    <button
                      key={inv.id}
                      onClick={() => {
                        if (emptySlotIdx >= 0) selectSlot(emptySlotIdx, inv);
                      }}
                      className="flex flex-col items-center gap-0.5 rounded border border-border p-1.5 text-[10px] hover:bg-bg-2"
                    >
                      <span
                        className="text-base"
                        style={{ color: `var(--gacha-${inv.item?.rarity ?? "common"})` }}
                      >
                        ◆
                      </span>
                      <span className="line-clamp-1 text-text-2">
                        {inv.item?.name}
                      </span>
                    </button>
                  );
                })}
                {eligible.length === 0 && (
                  <p className="col-span-full py-2 text-center text-xs text-text-3">
                    Sem itens elegíveis
                  </p>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          {/* Fuse button */}
          <button
            onClick={handleFuse}
            disabled={!canFuse || loading}
            className={cn(
              "w-full rounded py-2 text-xs font-semibold transition-colors",
              canFuse
                ? "bg-[--gacha-epic]/20 text-[--gacha-epic] hover:bg-[--gacha-epic]/30"
                : "cursor-not-allowed bg-bg-2 text-text-3"
            )}
          >
            {loading ? "Fundindo..." : "Confirmar Fusão"}
          </button>
        </>
      )}

      {/* Done state */}
      {phase === "done" && result && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-xl text-4xl"
            style={{
              background: `var(--gacha-${result.rarity}-dim)`,
              color: `var(--gacha-${result.rarity})`,
              boxShadow: `var(--gacha-glow-${result.rarity})`,
            }}
          >
            ◆
          </div>
          <h4 className="text-sm font-semibold text-text-1">{result.name}</h4>
          <RarityBadge rarity={result.rarity} />
          <button
            onClick={() => {
              onFused?.();
              setPhase("select");
              setSlots([null, null, null]);
              setResult(null);
            }}
            className="mt-2 rounded border border-border px-4 py-1.5 text-xs text-text-2 hover:bg-bg-2"
          >
            Continuar
          </button>
        </div>
      )}
    </div>
  );
}
