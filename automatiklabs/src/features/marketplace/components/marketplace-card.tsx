"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { formatRelativeTime } from "@/shared/utils/format-date";
import type { MarketplaceItemWithAuthor, ItemType } from "../types";

interface MarketplaceCardProps {
  item: MarketplaceItemWithAuthor;
}

function getTypeLabel(type: ItemType): { label: string; colorClass: string } {
  switch (type) {
    case "template":
      return { label: "TEMPLATE", colorClass: "text-cyan bg-cyan-dim" };
    case "github_project":
      return { label: "GITHUB", colorClass: "text-blue bg-blue-dim" };
    case "skill":
      return { label: "SKILL", colorClass: "text-amber bg-[rgba(240,160,48,0.12)]" };
  }
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      <div className="flex gap-[1px]">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-[12px] ${star <= Math.round(rating) ? "text-amber" : "text-text-3/30"}`}
          >
            {"\u2605"}
          </span>
        ))}
      </div>
      <span className="font-mono text-[11px] text-text-3">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MarketplaceCard({ item }: MarketplaceCardProps) {
  const typeInfo = getTypeLabel(item.type);

  return (
    <Link href={`/marketplace/${item.slug}`}>
      <article className="group/card relative rounded-[2px] border-2 border-border bg-bg-raised p-5 transition-all duration-[80ms] hover:translate-y-[-1px] hover:border-blue hover:shadow-[4px_4px_0_0_var(--color-blue-dim)]">
        {/* Type label */}
        <span
          className={`inline-block rounded-[2px] px-[6px] py-[2px] font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${typeInfo.colorClass}`}
        >
          {typeInfo.label}
        </span>

        {/* Title */}
        <h3 className="mt-3 font-display text-[15px] font-semibold leading-[1.3] tracking-[-0.03em] text-text-1 line-clamp-2">
          {item.title}
        </h3>

        {/* Description preview */}
        {item.description_md && (
          <p className="mt-2 text-[13px] leading-[1.5] text-text-2 line-clamp-2">
            {item.description_md.slice(0, 120)}
            {item.description_md.length > 120 ? "..." : ""}
          </p>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-[4px]">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] border border-border bg-bg-inset px-[5px] py-[1px] font-mono text-[10px] text-text-3"
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 4 && (
              <span className="font-mono text-[10px] text-text-3">
                +{item.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Rating + Downloads */}
        <div className="mt-3 flex items-center justify-between">
          <RatingStars rating={item.avg_rating} count={item.review_count} />
          <span className="font-mono text-[11px] text-text-3">
            {item.download_count} downloads
          </span>
        </div>

        {/* Author + Date */}
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Avatar className="size-5">
            {item.author.avatar_url ? (
              <AvatarImage
                src={item.author.avatar_url}
                alt={item.author.full_name}
              />
            ) : null}
            <AvatarFallback className="text-[8px]">
              {getInitials(item.author.full_name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[12px] text-text-2 truncate">
            {item.author.full_name}
          </span>
          <span className="ml-auto font-mono text-[10px] text-text-3">
            {formatRelativeTime(new Date(item.created_at))}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default MarketplaceCard;
