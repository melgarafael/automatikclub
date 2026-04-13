"use client";

import { useEffect, useRef, useMemo } from "react";
import { RarityBadge } from "../rarity-badge";
import type { PullResult, ItemRarity } from "../../types";

interface CelebrationPhaseProps {
  result: PullResult;
  onComplete: () => void;
}

const CONFETTI_COUNT = 20;
const CONFETTI_COUNT_LEGENDARY = 36;

/**
 * CSS confetti particles in the rarity color + pulsing glow.
 * Legendary gets more particles, longer duration, and golden hue animation.
 */

function generateConfetti(
  count: number,
  rarity: ItemRarity
): Array<{
  cx: string;
  cy: string;
  cr: string;
  delay: string;
  size: number;
}> {
  return Array.from({ length: count }, () => ({
    cx: `${(Math.random() - 0.5) * 300}px`,
    cy: `${-100 - Math.random() * 200}px`,
    cr: `${Math.random() * 720 - 360}deg`,
    delay: `${Math.random() * 400}ms`,
    size: rarity === "legendary" ? 4 + Math.random() * 4 : 3 + Math.random() * 3,
  }));
}

export function CelebrationPhase({
  result,
  onComplete,
}: CelebrationPhaseProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isLegendary = result.rarity === "legendary";

  const confetti = useMemo(
    () =>
      generateConfetti(
        isLegendary ? CONFETTI_COUNT_LEGENDARY : CONFETTI_COUNT,
        result.rarity
      ),
    [isLegendary, result.rarity]
  );

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const prop = isLegendary
      ? "--gacha-celebration-legendary"
      : "--gacha-celebration";
    const raw = style.getPropertyValue(prop).trim();
    const ms = parseInt(raw, 10) || (isLegendary ? 3000 : 2000);

    timerRef.current = setTimeout(onComplete, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete, isLegendary]);

  const durationVar = isLegendary
    ? "var(--gacha-celebration-legendary)"
    : "var(--gacha-celebration)";

  return (
    <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden">
      {/* Confetti particles */}
      {confetti.map((c, i) => (
        <span
          key={i}
          className="gacha-anim-confetti absolute rounded-full"
          style={{
            "--cx": c.cx,
            "--cy": c.cy,
            "--cr": c.cr,
            width: c.size,
            height: c.size,
            background: `var(--gacha-${result.rarity})`,
            animation: `gacha-confetti-fall ${durationVar} var(--gacha-ease-celebration) forwards`,
            animationDelay: c.delay,
          } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}

      {/* Background glow pulse */}
      <div
        className="gacha-anim-celebration absolute h-48 w-48 rounded-full"
        style={{
          background: `radial-gradient(circle, var(--gacha-${result.rarity}) 0%, transparent 70%)`,
          animation: `gacha-celebration-pulse ${durationVar} var(--gacha-ease-celebration) forwards`,
          opacity: 0.8,
        }}
        aria-hidden="true"
      />

      {/* Legendary: extra hue rotation on the glow */}
      {isLegendary && (
        <div
          className="gacha-legendary-hue absolute h-56 w-56 rounded-full"
          style={{
            background: `radial-gradient(circle, var(--gacha-legendary) 0%, transparent 60%)`,
            animation: `gacha-legendary-hue 1.5s ease-in-out infinite, gacha-celebration-pulse ${durationVar} var(--gacha-ease-celebration) forwards`,
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      )}

      {/* Item result (persistent) */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: `var(--gacha-gradient-${result.rarity})`,
            boxShadow: `var(--gacha-glow-${result.rarity})`,
          }}
          aria-hidden="true"
        >
          <span className="text-[32px]">
            {result.rarity === "legendary"
              ? "★"
              : result.rarity === "epic"
                ? "◆"
                : result.rarity === "rare"
                  ? "●"
                  : "○"}
          </span>
        </div>

        <span className="font-display text-[18px] font-bold text-text-1">
          {result.item.name}
        </span>

        <RarityBadge rarity={result.rarity} />

        {result.isNew && (
          <span className="rounded-[2px] bg-blue px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
            NOVO!
          </span>
        )}

        {(result.wasPity || result.wasSoftPity || result.wasGuaranteed) && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-text-3">
            {result.wasGuaranteed
              ? "garantido"
              : result.wasPity
                ? "pity"
                : "soft pity"}
          </span>
        )}
      </div>
    </div>
  );
}
