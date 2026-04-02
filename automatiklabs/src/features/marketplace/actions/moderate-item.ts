"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { moderateItemSchema } from "../schemas/marketplace";
import { hasMinRole, type UserRole } from "@/shared/lib/auth/roles";

export type ModerateItemState = {
  error?: string;
  success?: boolean;
};

export async function moderateItem(
  _prevState: ModerateItemState,
  formData: FormData
): Promise<ModerateItemState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Check role: moderador+
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !hasMinRole(profile.role as UserRole, "moderador")) {
    return { error: "Apenas moderadores podem moderar itens" };
  }

  const raw = {
    item_id: formData.get("item_id") as string,
    action: formData.get("action") as string,
    rejection_reason: (formData.get("rejection_reason") as string) || undefined,
  };

  const parsed = moderateItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: "Dados invalidos" };
  }

  const updateData: Record<string, unknown> = {
    status: parsed.data.action,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.action === "rejected" && parsed.data.rejection_reason) {
    updateData.rejection_reason = parsed.data.rejection_reason;
  }

  const { error } = await supabase
    .from("marketplace_items")
    .update(updateData)
    .eq("id", parsed.data.item_id);

  if (error) {
    console.error("[moderate-item] error:", error.message);
    return { error: "Erro ao moderar item. Tente novamente." };
  }

  revalidatePath("/marketplace");

  return { success: true };
}
