import { notFound } from "next/navigation";
import { createClient } from "@/shared/lib/supabase/server";
import { ItemDetail } from "@/features/marketplace/components/item-detail";
import type {
  MarketplaceItemWithAuthor,
  MarketplaceItemAuthor,
  MarketplaceReviewWithAuthor,
} from "@/features/marketplace/types";

interface ItemDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch item with author
  const { data: rawItem, error } = await supabase
    .from("marketplace_items")
    .select(
      "*, author:user_profiles!marketplace_items_author_id_fkey(id, full_name, username, avatar_url, role)"
    )
    .eq("slug", slug)
    .single();

  if (error || !rawItem) {
    notFound();
  }

  // Only show approved items (or own items for author)
  if (rawItem.status !== "approved" && rawItem.author_id !== user?.id) {
    notFound();
  }

  const item: MarketplaceItemWithAuthor = {
    ...rawItem,
    author: rawItem.author as unknown as MarketplaceItemAuthor,
  };

  // Fetch reviews with author info
  const { data: rawReviews } = await supabase
    .from("marketplace_reviews")
    .select(
      "*, author:user_profiles!marketplace_reviews_user_id_fkey(id, full_name, username, avatar_url, role)"
    )
    .eq("item_id", item.id)
    .order("created_at", { ascending: false });

  const reviews: MarketplaceReviewWithAuthor[] = (rawReviews ?? []).map(
    (row) => ({
      ...row,
      author: row.author as unknown as MarketplaceItemAuthor,
    })
  );

  // Check if current user already reviewed
  const userHasReviewed = user
    ? reviews.some((r) => r.user_id === user.id)
    : false;

  const isAuthor = user?.id === item.author_id;
  const isLoggedIn = !!user;

  return (
    <div className="py-5">
      <ItemDetail
        item={item}
        reviews={reviews}
        userHasReviewed={userHasReviewed}
        isAuthor={isAuthor}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
