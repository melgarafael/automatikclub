"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type {
  MarketplaceFilters,
  PaginatedItems,
  MarketplaceItemWithAuthor,
  MarketplaceItemAuthor,
} from "../types";

export async function getItems(
  filters: MarketplaceFilters = {}
): Promise<PaginatedItems> {
  const {
    search,
    type,
    tags,
    minRating,
    sortBy = "recent",
    page = 1,
    limit = 20,
  } = filters;

  const supabase = await createClient();

  let query = supabase
    .from("marketplace_items")
    .select(
      "*, author:user_profiles!marketplace_items_author_id_fkey(id, full_name, username, avatar_url, role)",
      { count: "exact" }
    )
    .eq("status", "approved");

  // Full-text search via PostgreSQL tsvector
  if (search && search.trim()) {
    query = query.textSearch("title", search.trim(), {
      type: "websearch",
    });
  }

  // Filter by type
  if (type) {
    query = query.eq("type", type);
  }

  // Filter by tags (contains any of the provided tags)
  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  // Filter by minimum rating
  if (minRating && minRating > 0) {
    query = query.gte("avg_rating", minRating);
  }

  // Sorting
  switch (sortBy) {
    case "top_rated":
      query = query.order("avg_rating", { ascending: false });
      break;
    case "most_downloaded":
      query = query.order("download_count", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error("[get-items] error:", error.message);
    return { items: [], total: 0, page, limit, hasMore: false };
  }

  const items: MarketplaceItemWithAuthor[] = (data ?? []).map((row) => ({
    ...row,
    author: row.author as unknown as MarketplaceItemAuthor,
  }));

  const total = count ?? 0;

  return {
    items,
    total,
    page,
    limit,
    hasMore: from + limit < total,
  };
}
