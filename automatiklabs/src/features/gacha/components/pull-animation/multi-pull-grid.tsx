"use client";

import { useEffect, useRef, useState } from "react";
import { RarityBadge } from "../rarity-badge";
import { RARITY_ORDER } from "../../types";
import type { PullResult } from "../../types";

interface MultiPullGridProps {
  results: PullResult[];
  onComplete: () => void;
}

function sortByRarityDesc(a: PullResult, b: PullResult) {
  return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
}

const CARD_REVEAL_DELAY = 200; // ms between each card

export function MultiPullGrid({ results, onComplete }: MultiPullGridProps) {
  const sorted = [...results].sort(sortByRarityDesc);
  const [revealedCount, setRevealedCount] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const allRevealed = revealedCount >= sorted.length || skipped;

  // Sequential reveal
  useEffect(() => {
    if (skipped || revealedCount >= sorted.length) return;

    timerRef.current = setTimeout(() => {
      setRevealedCount((c) => c + 1);
    }, CARD_REVEAL_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [revealedCount, sorted.length, skipped]);

  // Auto-complete 1.5s after all revealed
  useEffect(() => {
    if (!allRevealed) return;

    const id = setTimeout(onComplete, 1500);
    return () => clearTimeout(id);
  }, [allRevealed, onComplete]);

  function handleSkip() {
    setSkipped(true);
    setRevealedCount(sorted.length);
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Grid 2x5 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {sorted.map((result, index) => {
          const isVisible = skipped || index < revealedCount;
          return (
            <div
              key={result.pullId}
              className="gacha-anim-card-pop relative flex h-[120px] w-[100px] flex-col items-center justify-center gap-1.5 rounded-[2px] border border-border p-2 text-center sm:h-[140px] sm:w-[110px]"
              style={{
                animation: isVisible
                  ? `gacha-card-pop 350ms var(--gacha-ease-reveal) forwards`
                  : "none",
                opacity: isVisible ? undefined : 0,
                boxShadow: isVisible
                  ? `var(--gacha-glow-${result.rarity})`
                  : "none",
              }}
            >
              {/* Icon placeholder */}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: `var(--gacha-gradient-${result.rarity})`,
                }}
                aria-hidden="true"
              >
                <span className="text-[14px]">
                  {result.rarity === "legendary"
                    ? "★"
                    : result.rarity === "epic"
                      ? "◆"
                      : result.rarity === "rare"
                        ? "●"
                        : "○"}
                </span>
              </div>

              <span className="line-clamp-2 font-mono text-[10px] font-medium text-text-1">
                {result.item.name}
              </span>

              <RarityBadge rarity={result.rarity} showStars={false} />

              {result.isNew && (
                <span className="absolute right-1 top-1 rounded-[2px] bg-blue px-1 py-px font-mono text-[8px] font-bold text-white">
                  NOVO
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Skip button — visible until all cards revealed */}
      {!allRevealed && (
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-[2px] border border-border px-4 py-1.5 font-mono text-[11px] text-text-3 transition-colors hover:border-border-hard hover:text-text-1"
          aria-label="Pular animação"
        >
          Pular ▸
        </button>
      )}

      {/* Screen reader announcement */}
      {allRevealed && (
        <div className="sr-only" role="status" aria-live="assertive">
          {sorted
            .map((r) => `${r.rarity.toUpperCase()} ${r.item.name}`)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
