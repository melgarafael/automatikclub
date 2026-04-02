"use client";

import { cn } from "@/shared/utils";

interface XpBadgeProps {
  xp: number;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Inline XP display: lightning bolt + formatted XP value.
 * Uses JetBrains Mono, cyan color per design system.
 */
export function XpBadge({ xp, className, size = "md" }: XpBadgeProps) {
  const formatted = xp.toLocaleString("pt-BR");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-cyan",
        size === "sm" ? "text-[11px]" : "text-[13px]",
        className
      )}
    >
      <span>&#9889;</span>
      <span className="font-semibold">{formatted} XP</span>
    </span>
  );
}
