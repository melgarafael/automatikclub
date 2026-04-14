"use client";

import { cn } from "@/shared/utils";
import { RarityBadge } from "./rarity-badge";
import { RARITY_ORDER } from "../types";
import type { PullResult } from "../types";

interface PullResultDisplayProps {
  results: PullResult[];
  onBack: () => void;
  className?: string;
}

function sortByRarityDesc(a: PullResult, b: PullResult) {
  return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
}

function ResultCard({ result }: { result: PullResult }) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-[2px] border p-4 text-center",
        "border-border"
      )}
      style={{
        boxShadow: `var(--gacha-glow-${result.rarity})`,
      }}
    >
      {result.isNew && (
        <span className="absolute right-2 top-2 rounded-[2px] bg-blue px-1 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
          NOVO
        </span>
      )}

      {/* Item icon placeholder */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full opacity-80"
        style={{
          background: `var(--gacha-gradient-${result.rarity})`,
        }}
        aria-hidden="true"
      >
        <span className="text-[20px]">
          {result.rarity === "legendary"
            ? "★"
            : result.rarity === "epic"
              ? "◆"
              : result.rarity === "rare"
                ? "●"
                : "○"}
        </span>
      </div>

      <span className="font-display text-[13px] font-semibold text-text-1">
        {result.item.name}
      </span>

      <RarityBadge rarity={result.rarity} />

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
  );
}

export function PullResultDisplay({
  results,
  onBack,
  className,
}: PullResultDisplayProps) {
  const isTenPull = results.length > 1;
  const sorted = [...results].sort(sortByRarityDesc);

  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-live="assertive"
      aria-label={`Resultado: ${results.map((r) => `${r.rarity} ${r.item.name}`).join(", ")}`}
    >
      <h2 className="text-center font-display text-[16px] font-bold text-text-1">
        {isTenPull ? "Resultado — 10 Pulls" : "Resultado"}
      </h2>

      <div
        className={cn(
          isTenPull
            ? "grid grid-cols-2 gap-3 sm:grid-cols-5"
            : "flex justify-center"
        )}
      >
        {sorted.map((result) => (
          <ResultCard key={result.pullId} result={result} />
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-[2px] border border-border px-6 py-2 font-mono text-[12px] text-text-2 transition-colors hover:border-border-hard hover:text-text-1"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
