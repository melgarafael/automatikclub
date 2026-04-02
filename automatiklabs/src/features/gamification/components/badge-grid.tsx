"use client";

import { cn } from "@/shared/utils";
import type { Badge, UserBadge } from "../types";

interface BadgeGridProps {
  allBadges: Badge[];
  earnedBadges: UserBadge[];
  onBadgeClick?: (badge: Badge) => void;
  className?: string;
}

/**
 * Grid of earned/locked badges.
 * Earned: blue-dim bg, full opacity.
 * Locked: opacity 0.3, grayscale.
 * Square cells, 2px radius per design system.
 */
export function BadgeGrid({
  allBadges,
  earnedBadges,
  onBadgeClick,
  className,
}: BadgeGridProps) {
  const earnedIds = new Set(earnedBadges.map((ub) => ub.badgeId));

  return (
    <div className={cn("grid grid-cols-4 gap-[6px]", className)}>
      {allBadges.map((badge) => {
        const earned = earnedIds.has(badge.id);
        return (
          <BadgeCell
            key={badge.id}
            badge={badge}
            earned={earned}
            onClick={() => onBadgeClick?.(badge)}
          />
        );
      })}
    </div>
  );
}

function BadgeCell({
  badge,
  earned,
  onClick,
}: {
  badge: Badge;
  earned: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex aspect-square cursor-pointer flex-col items-center justify-center gap-[2px] rounded-[2px] border text-[18px] transition-all duration-[80ms]",
        earned
          ? "border-[rgba(74,158,255,0.3)] bg-blue-dim"
          : "border-border opacity-30 grayscale",
        "hover:border-border-hard hover:bg-bg-hover"
      )}
      title={earned ? badge.name : `${badge.name} (bloqueado)`}
    >
      <span>{badge.iconUrl ?? "&#9733;"}</span>
      <span className="font-mono text-[8px] uppercase tracking-[0.05em] text-text-3">
        {badge.slug.slice(0, 6)}
      </span>
    </button>
  );
}
