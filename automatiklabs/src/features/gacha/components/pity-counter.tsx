"use client";

import { cn } from "@/shared/utils";
import type { PityState } from "../types";

interface PityCounterProps {
  pity: PityState | null;
  className?: string;
}

interface PityBarProps {
  label: string;
  current: number;
  softAt: number;
  hardAt: number;
  color: string;
}

function PityBar({ label, current, softAt, hardAt, color }: PityBarProps) {
  const pct = Math.min((current / hardAt) * 100, 100);
  const softPct = (softAt / hardAt) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-2">{label}</span>
        <span className="text-text-1">
          {current}/{hardAt}{" "}
          <span className="text-text-3">(soft em {softAt})</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        {/* Soft pity marker */}
        <div
          className="absolute top-0 h-full w-px bg-white/20"
          style={{ left: `${softPct}%` }}
          aria-hidden="true"
        />
        {/* Progress fill */}
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${pct}%`,
            background: color,
          }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={hardAt}
          aria-label={`${label}: ${current} de ${hardAt} pulls`}
        />
      </div>
    </div>
  );
}

export function PityCounter({ pity, className }: PityCounterProps) {
  const pullCount = pity?.pullCount ?? 0;

  return (
    <div className={cn("space-y-2.5", className)}>
      <PityBar
        label="Epic"
        current={pullCount % 40}
        softAt={30}
        hardAt={40}
        color="var(--gacha-epic)"
      />
      <PityBar
        label="Legendary"
        current={pullCount % 80}
        softAt={60}
        hardAt={80}
        color="var(--gacha-legendary)"
      />
    </div>
  );
}
