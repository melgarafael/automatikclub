"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type SendNewsletterState = {
  error?: string;
  success?: boolean;
};

/**
 * Mark a newsletter as sent.
 * Admin only. Placeholder for Resend integration.
 *
 * In production, this would:
 * 1. Fetch all active subscribers
 * 2. Send emails in batches via Resend API
 * 3. Track delivery status
 *
 * For now, it marks the newsletter as sent to make it
 * visible in the public archive.
 */
export async function sendNewsletter(
  _prevState: SendNewsletterState,
  formData: FormData
): Promise<SendNewsletterState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Verify admin
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Apenas administradores podem enviar newsletters" };
  }

  const newsletterId = formData.get("newsletter_id") as string;

  if (!newsletterId) {
    return { error: "ID da newsletter obrigatorio" };
  }

  const adminClient = createAdminClient();

  // Verify newsletter exists and is draft
  const { data: newsletter } = await adminClient
    .from("newsletters")
    .select("id, status, content_html")
    .eq("id", newsletterId)
    .single();

  if (!newsletter) {
    return { error: "Newsletter nao encontrada" };
  }

  if (newsletter.status === "sent") {
    return { error: "Esta newsletter ja foi enviada" };
  }

  if (!newsletter.content_html) {
    return { error: "A newsletter nao tem conteudo" };
  }

  // TODO: Integrate with Resend API for actual email delivery
  // const subscribers = await adminClient
  //   .from("newsletter_subscribers")
  //   .select("email")
  //   .eq("is_active", true);
  // await sendBatchEmails(subscribers, newsletter);

  // Mark as sent
  const { error } = await adminClient
    .from("newsletters")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", newsletterId);

  if (error) {
    console.error("[send-newsletter] Update error:", error.message);
    return { error: "Erro ao enviar newsletter. Tente novamente." };
  }

  revalidatePath("/newsletter");
  return { success: true };
}
