"use client";

import { cn } from "@/shared/utils";
import type { ItemRarity } from "../types";

const RARITY_CONFIG = {
  common: {
    label: "COMMON",
    stars: 1,
    classes: "text-[--gacha-common] border border-border bg-transparent",
  },
  uncommon: {
    label: "UNCOMMON",
    stars: 2,
    classes: "text-[--gacha-uncommon] bg-[--gacha-uncommon-dim]",
  },
  rare: {
    label: "RARE",
    stars: 3,
    classes: "text-[--gacha-rare] bg-[--gacha-rare-dim]",
  },
  epic: {
    label: "EPIC",
    stars: 4,
    classes:
      "text-[--gacha-epic] bg-[--gacha-epic-dim] border border-[rgba(168,85,247,0.25)]",
  },
  legendary: {
    label: "LEGENDARY",
    stars: 5,
    classes:
      "text-[--gacha-legendary] bg-[--gacha-legendary-dim] border border-[rgba(245,158,11,0.25)]",
  },
} as const satisfies Record<ItemRarity, { label: string; stars: number; classes: string }>;

interface RarityBadgeProps {
  rarity: ItemRarity;
  className?: string;
  showStars?: boolean;
}

export function RarityBadge({
  rarity,
  className,
  showStars = true,
}: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity];
  const stars = showStars ? "★".repeat(config.stars) : "";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider",
        config.classes,
        className
      )}
      aria-label={`Raridade: ${config.label}, ${config.stars} de 5 estrelas`}
    >
      {showStars && <span aria-hidden="true">{stars}</span>}
      <span>{config.label}</span>
    </span>
  );
}
