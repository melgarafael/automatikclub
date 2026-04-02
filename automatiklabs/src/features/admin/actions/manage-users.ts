"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/shared/lib/auth/roles";
import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";
import type { AdminUser } from "../types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, error: "Nao autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase: null, error: "Acesso negado" };
  }

  return { supabase, error: null };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data: users } = await supabase
    .from("user_profiles")
    .select("id, full_name, username, email, role, tier, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (!users) return [];

  // Get XP for each user
  const userIds = users.map((u) => u.id);
  const { data: xpRows } = await supabase
    .from("user_xp")
    .select("user_id, total_xp")
    .in("user_id", userIds);

  const xpMap = new Map(xpRows?.map((x) => [x.user_id, x.total_xp]) ?? []);

  return users.map((u) => ({
    ...u,
    xp: xpMap.get(u.id) ?? 0,
  }));
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro de autenticacao" };

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ role })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/users");
  return {};
}

export async function updateUserTier(
  userId: string,
  tier: SubscriptionTier
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro de autenticacao" };

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ tier })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/users");
  return {};
}

export async function removeUser(
  userId: string
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro de autenticacao" };

  // Soft-delete: set a banned status
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ role: "aluno", is_banned: true })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/users");
  return {};
}
