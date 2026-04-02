"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AdminActionState } from "../types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase: null, userId: null, error: "Nao autenticado" };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { supabase: null, userId: null, error: "Acesso negado" };
  }

  return { supabase, userId: user.id, error: null };
}

export async function getAdminChallenges() {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return [];

  const { data } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function createChallenge(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const { supabase, userId, error } = await assertAdmin();
  if (error || !supabase || !userId) return { error: error ?? "Erro" };

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const criteria_type = formData.get("criteria_type") as string;
  const criteria_value = parseInt(formData.get("criteria_value") as string, 10);
  const xp_reward = parseInt(formData.get("xp_reward") as string, 10);
  const starts_at = formData.get("starts_at") as string;
  const ends_at = formData.get("ends_at") as string;

  if (!title) return { error: "Titulo obrigatorio" };

  const { error: insertError } = await supabase.from("challenges").insert({
    title,
    description: description || null,
    criteria_type: criteria_type || "total_points",
    criteria_value: criteria_value || 100,
    xp_reward: xp_reward || 50,
    starts_at: starts_at || new Date().toISOString(),
    ends_at: ends_at || null,
    status: "draft",
    created_by: userId,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/admin/challenges");
  return { success: true };
}

export async function updateChallengeStatus(
  id: string,
  status: "draft" | "active" | "completed" | "expired"
): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: updateError } = await supabase
    .from("challenges")
    .update({ status })
    .eq("id", id);

  if (updateError) return { error: updateError.message };

  revalidatePath("/admin/challenges");
  return {};
}

export async function deleteChallenge(id: string): Promise<{ error?: string }> {
  const { supabase, error } = await assertAdmin();
  if (error || !supabase) return { error: error ?? "Erro" };

  const { error: deleteError } = await supabase
    .from("challenges")
    .delete()
    .eq("id", id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath("/admin/challenges");
  return {};
}
