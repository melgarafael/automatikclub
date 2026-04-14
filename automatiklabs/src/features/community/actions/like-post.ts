"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function likePost(postId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike — remove the like
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) {
      return { error: "Erro ao remover like" };
    }

    revalidatePath("/feed");
    return { liked: false };
  }

  // Like — insert
  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: user.id });

  if (error) {
    return { error: "Erro ao curtir post" };
  }

  revalidatePath("/feed");
  return { liked: true };
}
