"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNewsletterSchema } from "../schemas/newsletter";

export type CreateNewsletterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Create a newsletter draft.
 * Admin only.
 */
export async function createNewsletter(
  _prevState: CreateNewsletterState,
  formData: FormData
): Promise<CreateNewsletterState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Apenas administradores podem criar newsletters" };
  }

  const raw = {
    title: formData.get("title") as string,
    slug: formData.get("slug") as string,
    content_html: (formData.get("content_html") as string) || null,
  };

  const parsed = createNewsletterSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("newsletters").insert({
    title: parsed.data.title,
    slug: parsed.data.slug,
    content_html: parsed.data.content_html ?? null,
    status: "draft",
    created_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ja existe uma newsletter com este slug" };
    }
    console.error("[create-newsletter] Insert error:", error.message);
    return { error: "Erro ao criar newsletter. Tente novamente." };
  }

  revalidatePath("/newsletter");
  return { success: true };
}
