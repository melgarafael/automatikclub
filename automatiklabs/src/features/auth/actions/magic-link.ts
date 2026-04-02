"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { magicLinkSchema } from "../schemas/auth";

export type MagicLinkState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function sendMagicLink(
  _prevState: MagicLinkState,
  formData: FormData
): Promise<MagicLinkState> {
  const raw = {
    email: formData.get("email") as string,
  };

  const parsed = magicLinkSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: "Erro ao enviar link. Tente novamente." };
  }

  return { success: true };
}
