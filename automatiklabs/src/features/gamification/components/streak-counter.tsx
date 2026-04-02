"use client";

import { cn } from "@/shared/utils";
import type { StreakInfo } from "../types";

interface StreakCounterProps {
  streak: StreakInfo;
  className?: string;
}

/**
 * Fire emoji + streak count + days label + bonus indicator.
 * Amber color per design system.
 */
export function StreakCounter({ streak, className }: StreakCounterProps) {
  const bonusPercent =
    streak.currentStreak >= 30
      ? 30
      : streak.currentStreak >= 7
        ? 15
        : streak.currentStreak >= 3
          ? 5
          : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] rounded-[2px] border-2 border-border bg-bg p-[10px_12px]",
        className
      )}
    >
      <span className="font-mono text-[22px] font-bold leading-none text-amber">
        {streak.currentStreak}
      </span>
      <div className="text-[12px] text-text-3">
        <div>dias seguidos</div>
      </div>
      {bonusPercent > 0 && (
        <span className="ml-auto font-mono text-[11px] text-cyan">
          +{bonusPercent}% XP
        </span>
      )}
    </div>
  );
}
