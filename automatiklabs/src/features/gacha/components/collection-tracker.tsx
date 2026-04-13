"use client";

import { cn } from "@/shared/utils";

interface CollectionTrackerProps {
  owned: number;
  total: number;
  byCategory: Record<string, { owned: number; total: number }>;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  booster: "Boosters",
  cosmetic: "Cosméticos",
  community: "Comunidade",
  asset: "Assets",
  external: "Externos",
};

export function CollectionTracker({
  owned,
  total,
  byCategory,
  className,
}: CollectionTrackerProps) {
  const overallPercent = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <div className={cn("space-y-5", className)}>
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-text-1">Coleção</h3>
          <span className="font-mono text-xs text-text-2">
            {owned}/{total} — {overallPercent}%
          </span>
        </div>
        <ProgressBar percent={overallPercent} />
      </div>

      {/* Per category */}
      <div className="space-y-3">
        {Object.entries(byCategory).map(([category, { owned: catOwned, total: catTotal }]) => {
          const percent = catTotal > 0 ? Math.round((catOwned / catTotal) * 100) : 0;

          return (
            <div key={category} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-2">
                  {CATEGORY_LABELS[category] ?? category}
                </span>
                <span className="font-mono text-[11px] text-text-3">
                  {catOwned}/{catTotal} — {percent}%
                </span>
              </div>
              <ProgressBar percent={percent} size="sm" />
            </div>
          );
        })}

        {Object.keys(byCategory).length === 0 && (
          <p className="text-xs text-text-3">Nenhuma categoria encontrada</p>
        )}
      </div>
    </div>
  );
}

// -- Progress Bar --

function ProgressBar({
  percent,
  size = "md",
}: {
  percent: number;
  size?: "sm" | "md";
}) {
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-bg-3", height)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percent}% completo`}
    >
      <div
        className={cn(
          "rounded-full transition-all duration-500",
          height,
          percent >= 100
            ? "bg-[--gacha-legendary]"
            : percent >= 75
              ? "bg-[--gacha-epic]"
              : percent >= 50
                ? "bg-[--gacha-rare]"
                : percent >= 25
                  ? "bg-[--gacha-uncommon]"
                  : "bg-[--gacha-common]"
        )}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
