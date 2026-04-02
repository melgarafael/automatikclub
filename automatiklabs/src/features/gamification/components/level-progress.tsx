"use client";

import { cn } from "@/shared/utils";
import type { LevelProgress as LevelProgressType } from "../types";

interface LevelProgressProps {
  level: LevelProgressType;
  className?: string;
}

/**
 * Current level name + ASCII-style progress bar to next level.
 * Uses the design system pattern: filled blocks + empty blocks.
 */
export function LevelProgress({ level, className }: LevelProgressProps) {
  const totalBlocks = 20;
  const filledBlocks = Math.round((level.progress / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;

  const progressBar =
    "\u2588".repeat(filledBlocks) + "\u2591".repeat(emptyBlocks);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] font-semibold text-text-1">
          Lv.{level.level} {level.name}
        </span>
        <span className="font-mono text-[11px] text-text-3">
          {level.currentXP.toLocaleString("pt-BR")} /{" "}
          {level.nextLevelXP.toLocaleString("pt-BR")} XP
        </span>
      </div>
      <div className="font-mono text-[10px] leading-none text-blue">
        {progressBar}
      </div>
      <div className="text-right font-mono text-[10px] text-text-3">
        {level.progress}%
      </div>
    </div>
  );
}
