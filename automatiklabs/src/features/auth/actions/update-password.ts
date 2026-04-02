"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";
import { updatePasswordSchema } from "../schemas/auth";

export type UpdatePasswordState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const raw = {
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const parsed = updatePasswordSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Erro ao atualizar senha. Tente novamente." };
  }

  redirect("/login");
}
