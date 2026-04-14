"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { resetPasswordSchema } from "../schemas/auth";
import { resetPasswordLimiter, formatRetryAfter } from "@/shared/lib/rate-limit";

export type ResetPasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const raw = {
    email: formData.get("email") as string,
  };

  const parsed = resetPasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Rate limit: 3 reset requests per email per 15 min
  const rl = resetPasswordLimiter(parsed.data.email.toLowerCase());
  if (!rl.allowed) {
    return {
      error: `Muitas tentativas. Tente novamente em ${formatRetryAfter(rl.retryAfterMs)}.`,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/redefinir-senha`,
  });

  if (error) {
    return { error: "Erro ao enviar email. Tente novamente." };
  }

  return { success: true };
}
