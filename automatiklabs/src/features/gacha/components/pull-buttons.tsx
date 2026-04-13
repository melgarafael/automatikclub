"use client";

import { cn } from "@/shared/utils";
import { GACHA_PULL_COST } from "../constants";

interface PullButtonsProps {
  onPullSingle: () => void;
  onPullTen: () => void;
  canPullSingle: boolean;
  canPullTen: boolean;
  isPulling: boolean;
  className?: string;
}

function Spinner() {
  return (
    <span
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

export function PullButtons({
  onPullSingle,
  onPullTen,
  canPullSingle,
  canPullTen,
  isPulling,
  className,
}: PullButtonsProps) {
  const disabledSingle = !canPullSingle || isPulling;
  const disabledTen = !canPullTen || isPulling;

  return (
    <div className={cn("flex gap-3", className)}>
      {/* Pull x1 */}
      <button
        type="button"
        onClick={onPullSingle}
        disabled={disabledSingle}
        title={
          !canPullSingle && !isPulling
            ? "Fragmentos insuficientes"
            : undefined
        }
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-[2px] border px-4 py-2.5 font-mono text-[13px] font-semibold transition-[border-color,opacity,background-color] duration-150",
          disabledSingle
            ? "cursor-not-allowed border-border bg-transparent text-text-3 opacity-50"
            : "border-blue bg-blue/10 text-blue hover:bg-blue/20 active:bg-blue/30"
        )}
      >
        {isPulling ? (
          <Spinner />
        ) : (
          <>
            Pull x1
            <span className="text-[11px] font-normal text-text-2">
              <span className="text-[--gacha-fragments]">◆</span>{" "}
              {GACHA_PULL_COST.single}
            </span>
          </>
        )}
      </button>

      {/* Pull x10 */}
      <button
        type="button"
        onClick={onPullTen}
        disabled={disabledTen}
        title={
          !canPullTen && !isPulling
            ? "Fragmentos insuficientes"
            : undefined
        }
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-[2px] border px-4 py-2.5 font-mono text-[13px] font-semibold transition-[border-color,opacity,background-color] duration-150",
          disabledTen
            ? "cursor-not-allowed border-border bg-transparent text-text-3 opacity-50"
            : "border-[--gacha-epic] bg-[--gacha-epic-dim] text-[--gacha-epic] hover:bg-[rgba(168,85,247,0.15)] active:bg-[rgba(168,85,247,0.2)]"
        )}
      >
        {isPulling ? (
          <Spinner />
        ) : (
          <>
            Pull x10
            <span className="text-[11px] font-normal text-text-2">
              <span className="text-[--gacha-fragments]">◆</span>{" "}
              {GACHA_PULL_COST.ten}
              <span className="ml-1 text-[--gacha-uncommon]">-10%</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
