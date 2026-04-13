"use client";

import { cn } from "@/shared/utils";

interface CurrencyDisplayProps {
  fragments: number;
  credits: number;
  variant?: "full" | "compact";
  className?: string;
}

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

export function CurrencyDisplay({
  fragments,
  credits,
  variant = "full",
  className,
}: CurrencyDisplayProps) {
  const isCompact = variant === "compact";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-text-1",
        isCompact ? "text-[11px]" : "text-[12px]",
        className
      )}
      role="status"
      aria-label={`${formatNumber(fragments)} fragmentos, ${formatNumber(credits)} créditos`}
    >
      {/* Fragments */}
      <span className="inline-flex items-center gap-1">
        <span className="text-[--gacha-fragments]" aria-hidden="true">
          ◆
        </span>
        <span className="font-semibold">{formatNumber(fragments)}</span>
        {!isCompact && (
          <span className="text-text-2">fragmentos</span>
        )}
      </span>

      <span className="text-text-3" aria-hidden="true">
        ·
      </span>

      {/* Credits */}
      <span className="inline-flex items-center gap-1">
        <span className="text-[--gacha-credits]" aria-hidden="true">
          ●
        </span>
        <span className="font-semibold">{formatNumber(credits)}</span>
        {!isCompact && (
          <span className="text-text-2">créditos</span>
        )}
      </span>
    </span>
  );
}
