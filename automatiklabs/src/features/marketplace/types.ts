import type { SubscriptionTier } from "@/features/auth/types";

// ── Item Types (mirrors DB enum marketplace_item_type) ──

export type ItemType = "skill" | "github_project" | "template";
export type ModerationStatus = "pending" | "approved" | "rejected";

// ── Marketplace Item ──

export interface MarketplaceItem {
  id: string;
  title: string;
  slug: string;
  type: ItemType;
  description_md: string | null;
  thumbnail_url: string | null;
  file_url: string | null;
  external_url: string | null;
  author_id: string;
  avg_rating: number;
  review_count: number;
  download_count: number;
  tags: string[];
  status: ModerationStatus;
  tier_required: SubscriptionTier;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceItemAuthor {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  role: string;
}

export interface MarketplaceItemWithAuthor extends MarketplaceItem {
  author: MarketplaceItemAuthor;
}

// ── Review ──

export interface MarketplaceReview {
  id: string;
  item_id: string;
  user_id: string;
  rating: number;
  content: string | null;
  created_at: string;
}

export interface MarketplaceReviewWithAuthor extends MarketplaceReview {
  author: MarketplaceItemAuthor;
}

// ── Download ──

export interface MarketplaceDownload {
  item_id: string;
  user_id: string;
  downloaded_at: string;
}

// ── Filters ──

export type SortOption = "recent" | "top_rated" | "most_downloaded";

export interface MarketplaceFilters {
  search?: string;
  type?: ItemType;
  tags?: string[];
  minRating?: number;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

// ── Paginated Result ──

export interface PaginatedItems {
  items: MarketplaceItemWithAuthor[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
