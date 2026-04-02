"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { changePasswordSchema } from "../schemas/profile";

export type ChangePasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const raw = {
    current_password: formData.get("current_password") as string,
    new_password: formData.get("new_password") as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const parsed = changePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Verify current password by attempting sign in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Nao autenticado" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });

  if (signInError) {
    return { error: "Senha atual incorreta" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) {
    return { error: "Erro ao atualizar senha. Tente novamente." };
  }

  return { success: true };
}
