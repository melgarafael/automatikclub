"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/shared/lib/auth/roles";

export type UpdateRoleState = {
  success?: boolean;
  error?: string;
};

export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<UpdateRoleState> {
  const supabase = await createClient();

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const { data: currentProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (currentProfile?.role !== "admin") {
    return { error: "Sem permissao. Apenas admins podem alterar roles." };
  }

  // Prevent admin from demoting themselves
  if (targetUserId === user.id) {
    return { error: "Voce nao pode alterar seu proprio role." };
  }

  const validRoles: UserRole[] = ["aluno", "contribuidor", "moderador", "admin"];
  if (!validRoles.includes(newRole)) {
    return { error: "Role invalido" };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", targetUserId);

  if (error) {
    return { error: "Erro ao atualizar role. Tente novamente." };
  }

  revalidatePath("/members");
  return { success: true };
}
