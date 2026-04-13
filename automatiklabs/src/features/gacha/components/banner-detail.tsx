"use client";

import { useEffect, useState } from "react";
import { cn } from "@/shared/utils";
import { getBannerItemsAction } from "../actions/get-banners";
import { RarityBadge } from "./rarity-badge";
import { BASE_RATES } from "../constants";
import type { BannerItem, GachaBanner, ItemRarity } from "../types";
import { RARITY_ORDER } from "../types";

interface BannerDetailProps {
  banner: GachaBanner;
  className?: string;
}

export function BannerDetail({ banner, className }: BannerDetailProps) {
  const [items, setItems] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRates, setShowRates] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getBannerItemsAction(banner.id).then((res) => {
      if (cancelled) return;
      setItems(res.items ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [banner.id]);

  const rateUpItems = items.filter((i) => i.isRateUp);

  return (
    <div
      className={cn(
        "space-y-4 rounded-[2px] border border-border p-4",
        className
      )}
    >
      {/* Featured items */}
      <div className="space-y-2">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3">
          Itens em destaque
        </h3>

        {loading ? (
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 w-28 animate-pulse rounded-[2px] bg-white/5"
              />
            ))}
          </div>
        ) : rateUpItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rateUpItems.map((bi) => (
              <div
                key={bi.itemId}
                className="flex items-center gap-2 rounded-[2px] border border-border px-3 py-2"
              >
                <span className="font-mono text-[12px] text-text-1">
                  {bi.item?.name ?? "Item"}
                </span>
                {bi.item && <RarityBadge rarity={bi.item.rarity} />}
                <span className="font-mono text-[10px] text-[--gacha-legendary]">
                  RATE UP
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[12px] text-text-3">
            Pool padrão — sem rate-up neste banner.
          </p>
        )}
      </div>

      {/* Pity rules */}
      <div className="space-y-1">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3">
          Pity
        </h3>
        <ul className="space-y-0.5 font-mono text-[11px] text-text-2">
          <li>
            Epic: soft pity em{" "}
            <span className="text-[--gacha-epic]">
              {banner.softPityStart}
            </span>
            , garantido em{" "}
            <span className="text-[--gacha-epic]">
              {banner.pityThreshold}
            </span>
          </li>
          <li>
            Legendary: soft pity em{" "}
            <span className="text-[--gacha-legendary]">60</span>, garantido em{" "}
            <span className="text-[--gacha-legendary]">80</span>
          </li>
          <li>Contador não reseta entre banners do mesmo tipo</li>
        </ul>
      </div>

      {/* Rates table (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowRates((v) => !v)}
          className="flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-text-3 transition-colors hover:text-text-1"
          aria-expanded={showRates}
        >
          <span
            className="inline-block transition-transform duration-150"
            style={{ transform: showRates ? "rotate(90deg)" : "rotate(0)" }}
            aria-hidden="true"
          >
            ▸
          </span>
          Probabilidades
        </button>

        {showRates && (
          <table className="mt-2 w-full font-mono text-[11px]">
            <thead>
              <tr className="border-b border-border text-left text-text-3">
                <th className="pb-1 pr-4 font-medium">Raridade</th>
                <th className="pb-1 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {RARITY_ORDER.map((rarity: ItemRarity) => (
                <tr key={rarity} className="border-b border-white/5">
                  <td className="py-1 pr-4">
                    <RarityBadge rarity={rarity} showStars={false} />
                  </td>
                  <td className="py-1 text-text-1">
                    {(BASE_RATES[rarity] * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
