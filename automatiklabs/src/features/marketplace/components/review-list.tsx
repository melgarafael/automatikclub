"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { formatRelativeTime } from "@/shared/utils/format-date";
import { EmptyState } from "@/shared/components/empty-state";
import type { MarketplaceReviewWithAuthor } from "../types";

interface ReviewListProps {
  reviews: MarketplaceReviewWithAuthor[];
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ReviewItem({ review }: { review: MarketplaceReviewWithAuthor }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="flex items-center gap-[10px]">
        <Avatar className="size-7">
          {review.author.avatar_url ? (
            <AvatarImage
              src={review.author.avatar_url}
              alt={review.author.full_name}
            />
          ) : null}
          <AvatarFallback className="text-[9px]">
            {getInitials(review.author.full_name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-text-1">
              {review.author.full_name}
            </span>

            {/* Stars */}
            <div className="flex gap-[1px]">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-[11px] ${star <= review.rating ? "text-amber" : "text-text-3/30"}`}
                >
                  {"\u2605"}
                </span>
              ))}
            </div>

            <span className="ml-auto font-mono text-[10px] text-text-3">
              {formatRelativeTime(new Date(review.created_at))}
            </span>
          </div>
        </div>
      </div>

      {review.content && (
        <p className="mt-2 pl-[38px] text-[13px] leading-[1.6] text-text-2">
          {review.content}
        </p>
      )}
    </div>
  );
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="Nenhuma avaliacao"
        description="Seja o primeiro a avaliar este item."
      />
    );
  }

  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-raised px-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}

export default ReviewList;
