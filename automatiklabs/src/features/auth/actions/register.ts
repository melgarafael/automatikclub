"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { registerSchema } from "../schemas/auth";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
    terms: formData.get("terms") === "on" ? true : undefined,
  };

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Este email ja esta cadastrado" };
    }
    if (error.message.includes("weak_password")) {
      return { error: "Senha muito fraca. Use letras, numeros e caracteres especiais" };
    }
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  redirect("/feed");
}
