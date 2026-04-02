"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateResponse } from "../services/ai-responder";
import type { TriggerAIResponseState, LessonContext, ThreadMessage } from "../types";

/**
 * Manual trigger: generates an AI response for a specific comment.
 * Only admin/moderador roles can invoke this action.
 */
export async function triggerAIResponse(
  _prevState: TriggerAIResponseState,
  formData: FormData
): Promise<TriggerAIResponseState> {
  const supabase = await createClient();

  // ── Auth check ──
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Autenticacao necessaria" };
  }

  // ── Role check: admin or moderador only ──
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "moderador"].includes(profile.role)) {
    return { error: "Permissao negada. Somente admin/moderador pode gerar respostas IA." };
  }

  const commentId = formData.get("comment_id") as string;

  if (!commentId) {
    return { error: "ID do comentario e obrigatorio" };
  }

  // ── Fetch the target comment ──
  const { data: comment } = await supabase
    .from("comments")
    .select("id, commentable_type, commentable_id, parent_id, content, author_id, is_ai_response")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return { error: "Comentario nao encontrado" };
  }

  if (comment.is_ai_response) {
    return { error: "Nao e possivel gerar resposta para um comentario de IA" };
  }

  // ── Only handle lesson comments for now ──
  if (comment.commentable_type !== "lesson") {
    return { error: "Resposta IA disponivel apenas para comentarios em aulas" };
  }

  // ── Fetch lesson context ──
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, description, tags, content_md")
    .eq("id", comment.commentable_id)
    .single();

  if (!lesson) {
    return { error: "Aula nao encontrada" };
  }

  const lessonContext: LessonContext = {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description ?? null,
    tags: lesson.tags ?? [],
    content_md: lesson.content_md ?? null,
  };

  // ── Fetch thread history (parent + siblings) ──
  const threadHistory: ThreadMessage[] = [];

  if (comment.parent_id) {
    const { data: threadComments } = await supabase
      .from("comments")
      .select("id, content, author_id, is_ai_response, created_at")
      .or(`id.eq.${comment.parent_id},parent_id.eq.${comment.parent_id}`)
      .neq("id", commentId)
      .order("created_at", { ascending: true })
      .limit(10);

    if (threadComments) {
      // Fetch author names for thread
      const authorIds = [...new Set(threadComments.map((c) => c.author_id))];
      const { data: authors } = await supabase
        .from("user_profiles")
        .select("id, full_name")
        .in("id", authorIds);

      const authorMap = new Map(
        (authors ?? []).map((a) => [a.id, a.full_name])
      );

      for (const tc of threadComments) {
        threadHistory.push({
          id: tc.id,
          content: tc.content,
          author_name: authorMap.get(tc.author_id) ?? "Usuario",
          is_ai_response: tc.is_ai_response,
          created_at: tc.created_at,
        });
      }
    }
  }

  // ── Generate AI response ──
  const result = await generateResponse(
    lessonContext,
    comment.content,
    threadHistory
  );

  if (!result) {
    return {
      error:
        "A IA nao conseguiu gerar uma resposta confiante para este comentario. Considere responder manualmente.",
    };
  }

  // ── Insert AI response as a comment ──
  const { error: insertError } = await supabase.from("comments").insert({
    commentable_type: comment.commentable_type,
    commentable_id: comment.commentable_id,
    parent_id: commentId,
    content: result.content,
    author_id: user.id,
    is_ai_response: true,
    ai_model: result.model,
    status: "approved",
    depth: comment.parent_id ? 2 : 1,
  });

  if (insertError) {
    return { error: "Erro ao salvar resposta da IA. Tente novamente." };
  }

  revalidatePath("/feed");
  revalidatePath("/learn", "layout");

  return { success: true, response: result.content };
}
