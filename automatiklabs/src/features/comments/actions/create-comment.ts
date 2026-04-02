"use server";

import { z } from "zod";
import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateCommentState } from "../types";

const createCommentSchema = z.object({
  commentable_type: z.enum(["lesson", "post", "ai_post"]),
  commentable_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable().optional(),
  content: z
    .string()
    .trim()
    .min(1, "O comentario nao pode estar vazio")
    .max(2000, "O comentario deve ter no maximo 2.000 caracteres"),
});

/**
 * Create a comment with depth validation (max 3) and status based on
 * platform_settings.auto_approve_comments config.
 */
export async function createComment(
  _prevState: CreateCommentState,
  formData: FormData
): Promise<CreateCommentState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para comentar" };
  }

  const raw = {
    commentable_type: formData.get("commentable_type") as string,
    commentable_id: formData.get("commentable_id") as string,
    parent_id: (formData.get("parent_id") as string) || null,
    content: formData.get("content") as string,
  };

  const parsed = createCommentSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // ── Rate limiting: 10 comments per hour ──
  const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count: recentCount } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .neq("status", "deleted")
    .gte("created_at", oneHourAgo);

  if (recentCount !== null && recentCount >= 10) {
    return { error: "Limite de comentarios atingido (10/hora). Tente novamente mais tarde." };
  }

  // ── Calculate depth ──
  let depth = 0;
  if (parsed.data.parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("depth, status")
      .eq("id", parsed.data.parent_id)
      .single();

    if (!parent) {
      return { error: "Comentario pai nao encontrado" };
    }

    if (parent.status === "deleted") {
      return { error: "Nao e possivel responder a um comentario removido" };
    }

    depth = parent.depth + 1;

    if (depth > 3) {
      return { error: "Profundidade maxima de respostas atingida (3 niveis)" };
    }
  }

  // ── Determine status from platform_settings ──
  let status: "approved" | "pending" = "approved";
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "auto_approve_comments")
    .single();

  if (setting && setting.value === "false") {
    status = "pending";
  }

  // ── Insert ──
  const { error } = await supabase.from("comments").insert({
    commentable_type: parsed.data.commentable_type,
    commentable_id: parsed.data.commentable_id,
    parent_id: parsed.data.parent_id ?? null,
    content: parsed.data.content,
    author_id: user.id,
    depth,
    status,
  });

  if (error) {
    return { error: "Erro ao criar comentario. Tente novamente." };
  }

  revalidatePath("/feed");
  revalidatePath("/learn", "layout");
  return { success: true };
}
