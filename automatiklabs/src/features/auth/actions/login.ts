"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema } from "../schemas/auth";
import { loginLimiter, formatRetryAfter } from "@/shared/lib/rate-limit";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Rate limit: 5 attempts per email per 15 min
  const rl = loginLimiter(parsed.data.email.toLowerCase());
  if (!rl.allowed) {
    return {
      error: `Muitas tentativas. Tente novamente em ${formatRetryAfter(rl.retryAfterMs)}.`,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "Email ou senha incorretos",
    };
  }

  redirect("/feed");
}
