"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createCommentSchema } from "../schemas/post";

export type CreateCommentState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

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

  // Calculate depth
  let depth = 0;
  if (parsed.data.parent_id) {
    const { data: parent } = await supabase
      .from("comments")
      .select("depth")
      .eq("id", parsed.data.parent_id)
      .single();

    if (!parent) {
      return { error: "Comentario pai nao encontrado" };
    }

    depth = parent.depth + 1;

    if (depth > 3) {
      return { error: "Profundidade maxima de respostas atingida (3 niveis)" };
    }
  }

  const { error } = await supabase.from("comments").insert({
    commentable_type: parsed.data.commentable_type,
    commentable_id: parsed.data.commentable_id,
    parent_id: parsed.data.parent_id ?? null,
    content: parsed.data.content,
    author_id: user.id,
    depth,
    status: "approved",
  });

  if (error) {
    return { error: "Erro ao criar comentario. Tente novamente." };
  }

  revalidatePath("/feed");
  return { success: true };
}
