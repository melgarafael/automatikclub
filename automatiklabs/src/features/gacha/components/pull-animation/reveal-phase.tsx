"use client";

import { useEffect, useRef } from "react";
import { parseCssDuration } from "../../lib/parse-css-duration";
import { RarityBadge } from "../rarity-badge";
import type { PullResult } from "../../types";

interface RevealPhaseProps {
  result: PullResult;
  onComplete: () => void;
}

/**
 * Flash → optional silence (legendary) → item splash.
 * Duration follows --gacha-reveal CSS var.
 */
export function RevealPhase({ result, onComplete }: RevealPhaseProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const raw = style.getPropertyValue("--gacha-reveal");
    const ms = parseCssDuration(raw, 1500);

    timerRef.current = setTimeout(onComplete, ms);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onComplete]);

  const isLegendary = result.rarity === "legendary";

  return (
    <div className="relative flex h-[300px] w-full items-center justify-center overflow-hidden">
      {/* White flash — 200ms */}
      <div
        className="gacha-anim-reveal absolute inset-0 bg-white"
        style={{
          animation: `gacha-flash var(--gacha-reveal-flash) ease-out forwards`,
        }}
        aria-hidden="true"
      />

      {/* Item card — appears after flash with scale animation */}
      <div
        className="gacha-anim-item-appear relative z-10 flex flex-col items-center gap-3"
        style={{
          animation: `gacha-item-appear var(--gacha-reveal) var(--gacha-ease-reveal) forwards`,
          animationDelay: isLegendary ? "400ms" : "200ms",
          opacity: 0,
        }}
      >
        {/* Item icon */}
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

        {/* Item name */}
        <span className="font-display text-[18px] font-bold text-text-1">
          {result.item.name}
        </span>

        {/* Rarity badge */}
        <RarityBadge rarity={result.rarity} />

        {/* New indicator */}
        {result.isNew && (
          <span className="rounded-[2px] bg-blue px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
            NOVO!
          </span>
        )}
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="assertive">
        {result.rarity.toUpperCase()} — {result.item.name}
        {result.isNew ? " — Novo item!" : ""}
      </div>
    </div>
  );
}
