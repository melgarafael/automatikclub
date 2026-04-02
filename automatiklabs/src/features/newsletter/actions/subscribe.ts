"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { subscribeSchema } from "../schemas/newsletter";

export type SubscribeState = {
  error?: string;
  success?: boolean;
};

/**
 * Subscribe an email to the newsletter.
 * Re-activates if previously unsubscribed.
 */
export async function subscribe(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const supabase = await createClient();

  const raw = { email: formData.get("email") as string };
  const parsed = subscribeSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.email?.[0] ?? "Email invalido" };
  }

  const email = parsed.data.email.toLowerCase();

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("newsletter_subscribers")
    .select("email, is_active")
    .eq("email", email)
    .single();

  if (existing) {
    if (existing.is_active) {
      return { error: "Este email ja esta inscrito" };
    }

    // Re-activate
    const { error } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: true, unsubscribed_at: null })
      .eq("email", email);

    if (error) {
      return { error: "Erro ao reativar inscricao. Tente novamente." };
    }

    revalidatePath("/newsletter");
    return { success: true };
  }

  // Get user_id if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("newsletter_subscribers").insert({
    email,
    user_id: user?.id ?? null,
    is_active: true,
  });

  if (error) {
    console.error("[subscribe] Insert error:", error.message);
    return { error: "Erro ao inscrever. Tente novamente." };
  }

  revalidatePath("/newsletter");
  return { success: true };
}
