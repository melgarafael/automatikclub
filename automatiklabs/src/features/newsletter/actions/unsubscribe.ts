"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UnsubscribeState = {
  error?: string;
  success?: boolean;
};

/**
 * Unsubscribe an email from the newsletter.
 * Marks is_active = false and sets unsubscribed_at.
 */
export async function unsubscribe(
  _prevState: UnsubscribeState,
  formData: FormData
): Promise<UnsubscribeState> {
  const supabase = await createClient();

  const email = (formData.get("email") as string)?.toLowerCase();

  if (!email) {
    return { error: "Email obrigatorio" };
  }

  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("email, is_active")
    .eq("email", email)
    .single();

  if (!existing) {
    return { error: "Email nao encontrado na lista de inscritos" };
  }

  if (!existing.is_active) {
    return { error: "Este email ja foi removido da lista" };
  }

  const { error } = await supabase
    .from("newsletter_subscribers")
    .update({
      is_active: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email);

  if (error) {
    console.error("[unsubscribe] Update error:", error.message);
    return { error: "Erro ao cancelar inscricao. Tente novamente." };
  }

  revalidatePath("/newsletter");
  return { success: true };
}
