"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createPostSchema } from "../schemas/post";

export type CreatePostState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para publicar" };
  }

  const raw = {
    content_md: formData.get("content_md") as string,
    channel_id: formData.get("channel_id") as string,
    tab_id: (formData.get("tab_id") as string) || null,
    title: (formData.get("title") as string) || null,
  };

  const parsed = createPostSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Validate channel exists and is active
  const { data: channel } = await supabase
    .from("channels")
    .select("id, is_archived")
    .eq("id", parsed.data.channel_id)
    .single();

  if (!channel || channel.is_archived) {
    return { error: "Canal invalido ou arquivado" };
  }

  // Validate tab belongs to channel if provided
  if (parsed.data.tab_id) {
    const { data: tab } = await supabase
      .from("channel_tabs")
      .select("id, channel_id")
      .eq("id", parsed.data.tab_id)
      .single();

    if (!tab || tab.channel_id !== parsed.data.channel_id) {
      return { error: "Aba nao pertence a este canal" };
    }
  }

  const { error } = await supabase.from("posts").insert({
    content_md: parsed.data.content_md,
    channel_id: parsed.data.channel_id,
    tab_id: parsed.data.tab_id ?? null,
    title: parsed.data.title ?? null,
    author_id: user.id,
    status: "published",
  });

  if (error) {
    return { error: "Erro ao criar post. Tente novamente." };
  }

  revalidatePath("/feed");
  revalidatePath(`/community`);

  return { success: true };
}
