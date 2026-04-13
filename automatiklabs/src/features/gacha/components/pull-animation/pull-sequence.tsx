"use client";

import "../../styles/pull-animation.css";

import { useCallback, useState } from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { AnticipationPhase } from "./anticipation-phase";
import { RevealPhase } from "./reveal-phase";
import { CelebrationPhase } from "./celebration-phase";
import { MultiPullGrid } from "./multi-pull-grid";
import { RARITY_ORDER } from "../../types";
import type { PullResult, ItemRarity } from "../../types";

type AnimPhase = "anticipation" | "reveal" | "celebration" | "complete";

interface PullSequenceProps {
  results: PullResult[];
  mode: "single" | "multi";
  onComplete: () => void;
}

function highestRarity(results: PullResult[]): ItemRarity {
  let best: ItemRarity = "common";
  for (const r of results) {
    if (RARITY_ORDER.indexOf(r.rarity) > RARITY_ORDER.indexOf(best)) {
      best = r.rarity;
    }
  }
  return best;
}

export function PullSequence({
  results,
  mode,
  onComplete,
}: PullSequenceProps) {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState<AnimPhase>("anticipation");
  const [skipped, setSkipped] = useState(false);

  const bestRarity = highestRarity(results);

  const handleSkip = useCallback(() => {
    setSkipped(true);
    onComplete();
  }, [onComplete]);

  const advancePhase = useCallback(
    (next: AnimPhase) => {
      if (skipped) return;
      if (next === "complete") {
        onComplete();
      } else {
        setPhase(next);
      }
    },
    [skipped, onComplete]
  );

  // Reduced motion: skip all animation, go straight to completion
  if (prefersReduced) {
    // Render a simple fade-in result announcement then complete
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="sr-only" role="status" aria-live="assertive">
          {results
            .map((r) => `${r.rarity.toUpperCase()} ${r.item.name}`)
            .join(", ")}
        </div>
        <p className="font-mono text-[13px] text-text-2">
          {results.length} {results.length === 1 ? "item obtido" : "itens obtidos"}
        </p>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-[2px] border border-border px-6 py-2 font-mono text-[12px] text-text-2 transition-colors hover:border-border-hard hover:text-text-1"
        >
          Ver resultado
        </button>
      </div>
    );
  }

  // Multi-pull: anticipation → grid reveal → complete (no per-item reveal/celebration)
  if (mode === "multi") {
    if (phase === "anticipation") {
      return (
        <div className="relative">
          <AnticipationPhase
            rarity={bestRarity}
            onComplete={() => advancePhase("reveal")}
          />
          <SkipButton onSkip={handleSkip} />
        </div>
      );
    }
    // Reveal + celebration merged into grid
    return (
      <div className="relative">
        <MultiPullGrid results={results} onComplete={onComplete} />
        <SkipButton onSkip={handleSkip} />
      </div>
    );
  }

  // Single pull: anticipation → reveal → celebration → complete
  const singleResult = results[0]!;

  return (
    <div className="relative">
      {phase === "anticipation" && (
        <AnticipationPhase
          rarity={singleResult.rarity}
          onComplete={() => advancePhase("reveal")}
        />
      )}

      {phase === "reveal" && (
        <RevealPhase
          result={singleResult}
          onComplete={() => advancePhase("celebration")}
        />
      )}

      {phase === "celebration" && (
        <CelebrationPhase
          result={singleResult}
          onComplete={() => advancePhase("complete")}
        />
      )}

      <SkipButton onSkip={handleSkip} />
    </div>
  );
}

function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="absolute bottom-4 right-4 z-20 rounded-[2px] border border-border bg-black/60 px-3 py-1 font-mono text-[11px] text-text-3 backdrop-blur-sm transition-colors hover:border-border-hard hover:text-text-1"
      aria-label="Pular animação"
    >
      Pular ▸
    </button>
  );
}
