"use client";

import { useCallback, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { MarkdownRenderer } from "@/shared/components/markdown-renderer";
import { formatDate } from "@/shared/utils/format-date";
import { downloadItem } from "../actions/download-item";
import { ReviewForm } from "./review-form";
import { ReviewList } from "./review-list";
import type { MarketplaceItemWithAuthor, MarketplaceReviewWithAuthor, ItemType } from "../types";

interface ItemDetailProps {
  item: MarketplaceItemWithAuthor;
  reviews: MarketplaceReviewWithAuthor[];
  userHasReviewed: boolean;
  isAuthor: boolean;
  isLoggedIn: boolean;
}

function getTypeLabel(type: ItemType): { label: string; colorClass: string } {
  switch (type) {
    case "template":
      return { label: "TEMPLATE", colorClass: "text-cyan bg-cyan-dim" };
    case "github_project":
      return { label: "GITHUB PROJECT", colorClass: "text-blue bg-blue-dim" };
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
            className={`text-[16px] ${star <= Math.round(rating) ? "text-amber" : "text-text-3/30"}`}
          >
            {"\u2605"}
          </span>
        ))}
      </div>
      <span className="font-mono text-[13px] text-text-2">
        {rating.toFixed(1)}
      </span>
      <span className="font-mono text-[11px] text-text-3">
        ({count} {count === 1 ? "avaliacao" : "avaliacoes"})
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

export function ItemDetail({
  item,
  reviews,
  userHasReviewed,
  isAuthor,
  isLoggedIn,
}: ItemDetailProps) {
  const [isPending, startTransition] = useTransition();
  const typeInfo = getTypeLabel(item.type);

  const handleDownload = useCallback(() => {
    startTransition(async () => {
      const result = await downloadItem(item.id);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    });
  }, [item.id]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span
          className={`inline-block rounded-[2px] px-[6px] py-[2px] font-mono text-[10px] font-medium uppercase tracking-[0.1em] ${typeInfo.colorClass}`}
        >
          {typeInfo.label}
        </span>

        <h1 className="mt-3 font-display text-[22px] font-bold leading-[1.2] tracking-[-0.03em] text-text-1">
          {item.title}
        </h1>

        <div className="mt-3 flex items-center gap-3">
          <RatingStars rating={item.avg_rating} count={item.review_count} />
          <span className="font-mono text-[11px] text-text-3">
            {item.download_count} downloads
          </span>
        </div>

        {/* Author info */}
        <div className="mt-4 flex items-center gap-3 rounded-[2px] border-2 border-border bg-bg-raised p-3">
          <Avatar>
            {item.author.avatar_url ? (
              <AvatarImage
                src={item.author.avatar_url}
                alt={item.author.full_name}
              />
            ) : null}
            <AvatarFallback>
              {getInitials(item.author.full_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[14px] font-semibold text-text-1">
                {item.author.full_name}
              </span>
              <Badge variant="contrib">@{item.author.username}</Badge>
            </div>
            <span className="font-mono text-[11px] text-text-3">
              Publicado em {formatDate(new Date(item.created_at))}
            </span>
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-[4px]">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-[2px] border border-border bg-bg-inset px-[6px] py-[2px] font-mono text-[10px] text-text-3"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Download / Link button */}
        <div className="mt-5">
          {item.type === "github_project" && item.external_url ? (
            <Button asChild>
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void downloadItem(item.id);
                }}
              >
                Abrir no GitHub
              </a>
            </Button>
          ) : item.type === "template" && item.file_url ? (
            <Button onClick={handleDownload} disabled={isPending}>
              {isPending ? "Preparando download..." : "Baixar template"}
            </Button>
          ) : item.external_url ? (
            <Button asChild>
              <a
                href={item.external_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void downloadItem(item.id);
                }}
              >
                Acessar
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Description */}
      {item.description_md && (
        <section>
          <h2 className="mb-4 font-display text-[16px] font-bold tracking-[-0.03em] text-text-1">
            Descricao
          </h2>
          <div className="rounded-[2px] border-2 border-border bg-bg-raised p-5">
            <MarkdownRenderer content={item.description_md} />
          </div>
        </section>
      )}

      {/* Reviews section */}
      <section>
        <h2 className="mb-4 font-display text-[16px] font-bold tracking-[-0.03em] text-text-1">
          Avaliacoes ({item.review_count})
        </h2>

        {/* Review form */}
        {isLoggedIn && !isAuthor && !userHasReviewed && (
          <div className="mb-6">
            <ReviewForm itemId={item.id} />
          </div>
        )}

        {userHasReviewed && (
          <p className="mb-4 rounded-[2px] border border-border bg-bg-inset px-3 py-2 font-mono text-[11px] text-text-3">
            Voce ja avaliou este item.
          </p>
        )}

        {/* Reviews list */}
        <ReviewList reviews={reviews} />
      </section>
    </div>
  );
}

export default ItemDetail;
