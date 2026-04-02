"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createBookSchema = z.object({
  title: z.string().trim().min(1, "Titulo obrigatorio").max(300),
  author_name: z.string().trim().max(200).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  cover_url: z.string().url("URL invalida").nullable().optional(),
  purchase_url: z.string().url("URL invalida").nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
});

export type CreateBookState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Create a new book recommendation.
 * Admin only.
 */
export async function createBook(
  _prevState: CreateBookState,
  formData: FormData
): Promise<CreateBookState> {
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
    return { error: "Apenas administradores podem adicionar livros" };
  }

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
    author_name: (formData.get("author_name") as string) || null,
    description: (formData.get("description") as string) || null,
    cover_url: (formData.get("cover_url") as string) || null,
    purchase_url: (formData.get("purchase_url") as string) || null,
    tags,
  };

  const parsed = createBookSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("books").insert({
    title: parsed.data.title,
    author_name: parsed.data.author_name ?? null,
    description: parsed.data.description ?? null,
    cover_url: parsed.data.cover_url ?? null,
    purchase_url: parsed.data.purchase_url ?? null,
    tags: parsed.data.tags,
    created_by: user.id,
  });

  if (error) {
    console.error("[create-book] Insert error:", error.message);
    return { error: "Erro ao criar livro. Tente novamente." };
  }

  revalidatePath("/books");
  return { success: true };
}
