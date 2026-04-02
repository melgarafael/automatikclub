"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createItemSchema } from "../schemas/marketplace";
import { hasMinRole, type UserRole } from "@/shared/lib/auth/roles";

export type CreateItemState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) +
    "-" +
    Date.now().toString(36)
  );
}

export async function createItem(
  _prevState: CreateItemState,
  formData: FormData
): Promise<CreateItemState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Check role: contribuidor+
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !hasMinRole(profile.role as UserRole, "contribuidor")) {
    return { error: "Apenas contribuidores podem submeter itens" };
  }

  // Parse tags from comma-separated string
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    : [];

  const raw = {
    type: formData.get("type") as string,
    title: formData.get("title") as string,
    description_md: formData.get("description_md") as string,
    tags,
    external_url: (formData.get("external_url") as string) || undefined,
    file_url: (formData.get("file_url") as string) || undefined,
  };

  const parsed = createItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const slug = generateSlug(parsed.data.title);

  const insertData: Record<string, unknown> = {
    title: parsed.data.title,
    slug,
    type: parsed.data.type,
    description_md: parsed.data.description_md,
    tags: parsed.data.tags,
    author_id: user.id,
    status: "pending",
  };

  if (parsed.data.type === "github_project") {
    insertData.external_url = parsed.data.external_url;
  } else if (parsed.data.type === "skill") {
    insertData.external_url =
      "external_url" in parsed.data && parsed.data.external_url
        ? parsed.data.external_url
        : null;
  } else if (parsed.data.type === "template") {
    insertData.file_url = parsed.data.file_url;
  }

  const { error } = await supabase.from("marketplace_items").insert(insertData);

  if (error) {
    console.error("[create-item] error:", error.message);
    return { error: "Erro ao submeter item. Tente novamente." };
  }

  revalidatePath("/marketplace");

  return { success: true };
}
