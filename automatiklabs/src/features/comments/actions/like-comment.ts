"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Toggle like on a comment.
 * If already liked, removes the like. Otherwise, adds it.
 */
export async function likeComment(
  commentId: string
): Promise<{ liked?: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);

    if (error) {
      return { error: "Erro ao remover like" };
    }

    revalidatePath("/feed");
    revalidatePath("/learn", "layout");
    return { liked: false };
  }

  // Like
  const { error } = await supabase
    .from("comment_likes")
    .insert({ comment_id: commentId, user_id: user.id });

  if (error) {
    return { error: "Erro ao curtir comentario" };
  }

  revalidatePath("/feed");
  revalidatePath("/learn", "layout");
  return { liked: true };
}
