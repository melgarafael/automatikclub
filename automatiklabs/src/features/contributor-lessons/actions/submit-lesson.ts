"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { submitLessonSchema } from "../schemas/lesson";

export type SubmitLessonState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Submit a contributor lesson for moderation.
 * Requires role: contribuidor+
 */
export async function submitLesson(
  _prevState: SubmitLessonState,
  formData: FormData
): Promise<SubmitLessonState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado para submeter uma aula" };
  }

  // Verify contribuidor+ role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["contribuidor", "moderador", "admin"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: "Apenas contribuidores podem submeter aulas" };
  }

  // Parse tags from comma-separated string or JSON
  let tags: string[] = [];
  const rawTags = formData.get("tags") as string;
  if (rawTags) {
    try {
      tags = JSON.parse(rawTags);
    } catch {
      tags = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    video_url: (formData.get("video_url") as string) || null,
    video_source: (formData.get("video_source") as string) || null,
    content_md: (formData.get("content_md") as string) || null,
    tags,
  };

  const parsed = submitLessonSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("contributor_lessons").insert({
    contributor_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    video_url: parsed.data.video_url ?? null,
    video_source: parsed.data.video_source ?? null,
    content_md: parsed.data.content_md ?? null,
    tags: parsed.data.tags,
    status: "pending",
  });

  if (error) {
    console.error("[submit-lesson] Insert error:", error.message);
    return { error: "Erro ao submeter aula. Tente novamente." };
  }

  revalidatePath("/learn/comunidade");
  revalidatePath("/learn/contribuir");

  return { success: true };
}
