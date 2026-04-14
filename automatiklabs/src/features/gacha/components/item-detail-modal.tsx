"use client";

import { useState, useCallback } from "react";
import { cn } from "@/shared/utils";
import type { InventoryItem, ItemRarity } from "../types";
import { RarityBadge } from "./rarity-badge";
import { GACHA_RECYCLE_VALUES, PRICE_FLOORS, PRICE_CEILINGS } from "../constants";
import { recycleItemAction } from "../actions/recycle";
import { listItemAction } from "../actions/list-item";

interface ItemDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onRecycled?: () => void;
  onListed?: () => void;
  onFuseRequest?: (item: InventoryItem) => void;
}

export function ItemDetailModal({
  item,
  onClose,
  onRecycled,
  onListed,
  onFuseRequest,
}: ItemDetailModalProps) {
  const [mode, setMode] = useState<"detail" | "recycle" | "sell">("detail");
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = useCallback(() => {
    setMode("detail");
    setSellPrice(0);
    setError(null);
    onClose();
  }, [onClose]);

  if (!item) return null;

  const rarity = item.item?.rarity ?? "common";
  const isTradeable = item.item?.bindType === "tradeable";
  const recycleCredits = GACHA_RECYCLE_VALUES[rarity];

  async function handleRecycle() {
    if (!item) return;
    setLoading(true);
    setError(null);

    const result = await recycleItemAction(item.id);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onRecycled?.();
      resetAndClose();
    }
  }

  async function handleList() {
    if (!item) return;
    setLoading(true);
    setError(null);

    const result = await listItemAction(item.id, sellPrice);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onListed?.();
      resetAndClose();
    }
  }

  const priceFloor = PRICE_FLOORS[rarity];
  const priceCeiling = PRICE_CEILINGS[rarity];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes: ${item.item?.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={resetAndClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-t-xl border border-border bg-bg-1 p-5 sm:rounded-xl",
          "max-h-[85vh] overflow-y-auto"
        )}
      >
        {/* Close */}
        <button
          onClick={resetAndClose}
          className="absolute right-3 top-3 text-text-3 hover:text-text-1"
          aria-label="Fechar"
        >
          ✕
        </button>

        {/* -- DETAIL MODE -- */}
        {mode === "detail" && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-3xl"
                style={{
                  background: `var(--gacha-${rarity}-dim)`,
                  color: `var(--gacha-${rarity})`,
                  boxShadow: `var(--gacha-glow-${rarity})`,
                }}
                aria-hidden="true"
              >
                {item.item?.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.item.iconUrl}
                    alt=""
                    className="h-full w-full rounded-lg object-contain"
                  />
                ) : (
                  "◆"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-text-1">
                  {item.item?.name}
                </h2>
                <RarityBadge rarity={rarity} className="mt-1" />
              </div>
            </div>

            {/* Info rows */}
            <dl className="space-y-2 text-xs">
              <InfoRow label="Categoria" value={item.item?.category ?? "—"} />
              <InfoRow
                label="Vínculo"
                value={isTradeable ? "Tradeable" : "Soulbound"}
              />
              <InfoRow
                label="Obtido via"
                value={item.obtainedVia}
              />
              <InfoRow
                label="Data"
                value={new Date(item.obtainedAt).toLocaleDateString("pt-BR")}
              />
              {item.item?.description && (
                <InfoRow label="Descrição" value={item.item.description} />
              )}
            </dl>

            {item.isLocked && (
              <p className="text-xs text-[--gacha-legendary]">
                🔒 Item bloqueado — listado no marketplace
              </p>
            )}

            {/* Actions */}
            {!item.isLocked && (
              <div className="flex flex-wrap gap-2 pt-2">
                <ActionButton
                  onClick={() => onFuseRequest?.(item)}
                  label="Fundir"
                />
                <ActionButton
                  onClick={() => setMode("recycle")}
                  label="Reciclar"
                  variant="warn"
                />
                {isTradeable && (
                  <ActionButton
                    onClick={() => {
                      setSellPrice(priceFloor);
                      setMode("sell");
                    }}
                    label="Vender"
                    variant="accent"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* -- RECYCLE CONFIRM -- */}
        {mode === "recycle" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-1">
              Reciclar {item.item?.name}?
            </h2>
            <p className="text-xs text-text-2">
              Você receberá{" "}
              <span className="font-semibold text-[--gacha-credits]">
                ● {recycleCredits} créditos
              </span>{" "}
              e o item será destruído permanentemente.
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("detail");
                  setError(null);
                }}
                className="flex-1 rounded border border-border px-3 py-2 text-xs text-text-2 hover:bg-bg-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleRecycle}
                disabled={loading}
                className="flex-1 rounded bg-red-500/20 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                {loading ? "Reciclando..." : "Confirmar Reciclagem"}
              </button>
            </div>
          </div>
        )}

        {/* -- SELL MODE -- */}
        {mode === "sell" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-1">
              Vender {item.item?.name}
            </h2>
            <div>
              <label className="text-xs text-text-2">
                Preço (créditos) — min {priceFloor}, max {priceCeiling}
              </label>
              <input
                type="number"
                min={priceFloor}
                max={priceCeiling}
                value={sellPrice}
                onChange={(e) => setSellPrice(Number(e.target.value))}
                className="mt-1 w-full rounded border border-border bg-bg-2 px-3 py-2 text-sm text-text-1"
              />
            </div>
            <p className="text-xs text-text-3">
              Taxa de 10% — você receberá{" "}
              <span className="text-text-1">
                {Math.floor(sellPrice * 0.9)} créditos
              </span>
            </p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("detail");
                  setError(null);
                }}
                className="flex-1 rounded border border-border px-3 py-2 text-xs text-text-2 hover:bg-bg-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleList}
                disabled={
                  loading ||
                  sellPrice < priceFloor ||
                  sellPrice > priceCeiling
                }
                className="flex-1 rounded bg-accent/20 px-3 py-2 text-xs font-medium text-accent hover:bg-accent/30 disabled:opacity-50"
              >
                {loading ? "Listando..." : "Listar no Marketplace"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Helpers --

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-3">{label}</dt>
      <dd className="text-right font-medium text-text-1 capitalize">{value}</dd>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  variant = "default",
}: {
  onClick: () => void;
  label: string;
  variant?: "default" | "warn" | "accent";
}) {
  const styles = {
    default:
      "border border-border text-text-2 hover:bg-bg-2",
    warn: "bg-red-500/10 text-red-400 hover:bg-red-500/20",
    accent: "bg-accent/10 text-accent hover:bg-accent/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1.5 text-xs font-medium transition-colors",
        styles[variant]
      )}
    >
      {label}
    </button>
  );
}
