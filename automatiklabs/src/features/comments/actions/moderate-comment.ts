"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommentStatus, ModerateCommentState } from "../types";

/**
 * Approve, reject, or soft-delete a comment.
 * Only moderador+ roles can execute this action.
 */
export async function moderateComment(
  commentId: string,
  action: "approved" | "rejected" | "deleted"
): Promise<ModerateCommentState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  // Check role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderador", "admin"].includes(profile.role)) {
    return { error: "Voce nao tem permissao para moderar comentarios" };
  }

  const { error } = await supabase
    .from("comments")
    .update({ status: action as CommentStatus })
    .eq("id", commentId);

  if (error) {
    return { error: "Erro ao moderar comentario" };
  }

  revalidatePath("/feed");
  revalidatePath("/learn", "layout");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetch all pending comments for the moderation queue.
 */
export async function getPendingComments() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderador", "admin"].includes(profile.role)) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      author:user_profiles!comments_author_id_fkey (
        id, full_name, username, role, avatar_url
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !rows) return [];

  return rows as Array<Record<string, unknown>>;
}
