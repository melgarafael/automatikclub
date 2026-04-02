"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { reviewSchema } from "../schemas/marketplace";

export type ReviewItemState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function reviewItem(
  _prevState: ReviewItemState,
  formData: FormData
): Promise<ReviewItemState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para avaliar" };
  }

  const raw = {
    item_id: formData.get("item_id") as string,
    rating: Number(formData.get("rating")),
    content: (formData.get("content") as string) || undefined,
  };

  const parsed = reviewSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Prevent self-review: check if user is the item author
  const { data: item } = await supabase
    .from("marketplace_items")
    .select("author_id, slug")
    .eq("id", parsed.data.item_id)
    .single();

  if (!item) {
    return { error: "Item nao encontrado" };
  }

  if (item.author_id === user.id) {
    return { error: "Voce nao pode avaliar seu proprio item" };
  }

  // Check existing review (UNIQUE constraint will also catch this)
  const { data: existingReview } = await supabase
    .from("marketplace_reviews")
    .select("id")
    .eq("item_id", parsed.data.item_id)
    .eq("user_id", user.id)
    .single();

  if (existingReview) {
    return { error: "Voce ja avaliou este item" };
  }

  const { error } = await supabase.from("marketplace_reviews").insert({
    item_id: parsed.data.item_id,
    user_id: user.id,
    rating: parsed.data.rating,
    content: parsed.data.content || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Voce ja avaliou este item" };
    }
    console.error("[review-item] error:", error.message);
    return { error: "Erro ao enviar avaliacao. Tente novamente." };
  }

  revalidatePath(`/marketplace/${item.slug}`);

  return { success: true };
}
