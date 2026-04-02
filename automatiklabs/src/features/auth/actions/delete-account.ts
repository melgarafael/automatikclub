"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { redirect } from "next/navigation";

export type DeleteAccountState = {
  error?: string;
};

export async function deleteAccount(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const confirmation = formData.get("confirmation") as string;

  if (confirmation !== "DELETAR") {
    return { error: 'Digite "DELETAR" para confirmar' };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  // Soft-delete: mark profile as deleted
  const { error: profileError } = await supabase
    .from("user_profiles")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Erro ao deletar conta. Tente novamente." };
  }

  // Sign out
  await supabase.auth.signOut({ scope: "local" });

  redirect("/login");
}
