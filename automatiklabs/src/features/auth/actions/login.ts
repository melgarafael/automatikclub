"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema } from "../schemas/auth";

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
