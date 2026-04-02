"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminActionState } from "@/features/admin/types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, userId: null, error: "Nao autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase: null, userId: null, error: "Acesso negado" };
  }

  return { supabase, userId: user.id, error: null };
}

export async function createBookAdmin(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, userId, error } = await assertAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const author_name = formData.get("author_name") as string;
  const description = formData.get("description") as string;
  const cover_url = formData.get("cover_url") as string;
  const purchase_url = formData.get("purchase_url") as string;
  const tagsRaw = formData.get("tags") as string;

  if (!title) return { error: "Titulo obrigatorio" };

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error: insertError } = await supabase.from("books").insert({
    title,
    author_name: author_name || null,
    description: description || null,
    cover_url: cover_url || null,
    purchase_url: purchase_url || null,
    tags,
    created_by: userId,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/books");
  return { success: true };
}

export async function deleteBook(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("books")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/books");
  return {};
}
