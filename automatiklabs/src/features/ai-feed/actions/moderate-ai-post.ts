"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { AIPostStatus } from "../types";

async function assertModerator() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase: null, userId: null, error: "Nao autenticado" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderador", "admin"].includes(profile.role)) {
    return { supabase: null, userId: null, error: "Permissao negada" };
  }

  return { supabase, userId: user.id, error: null };
}

export async function moderateAIPost(
  postId: string,
  action: "approved" | "rejected"
) {
  const { supabase, userId, error: authError } = await assertModerator();

  if (authError || !supabase || !userId) {
    return { error: authError ?? "Erro de autenticacao" };
  }

  const updateData: Record<string, unknown> = {
    status: action as AIPostStatus,
  };

  if (action === "approved") {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("ai_posts")
    .update(updateData)
    .eq("id", postId)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return { error: null };
}

export async function bulkModerateAIPosts(
  postIds: string[],
  action: "approved" | "rejected"
) {
  const { supabase, userId, error: authError } = await assertModerator();

  if (authError || !supabase || !userId) {
    return { error: authError ?? "Erro de autenticacao" };
  }

  const updateData: Record<string, unknown> = {
    status: action as AIPostStatus,
  };

  if (action === "approved") {
    updateData.approved_by = userId;
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("ai_posts")
    .update(updateData)
    .in("id", postIds)
    .eq("status", "pending");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/feed");
  return { error: null };
}

export async function getPendingAIPosts() {
  const { supabase, error: authError } = await assertModerator();

  if (authError || !supabase) {
    return { posts: [], error: authError };
  }

  const { data: rows, error } = await supabase
    .from("ai_posts")
    .select(
      `
      *,
      agent:ai_agents!ai_posts_agent_id_fkey (
        id, name, slug, avatar_url
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error || !rows) {
    return { posts: [], error: error?.message ?? null };
  }

  return { posts: rows, error: null };
}
