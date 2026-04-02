"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import type { AIAgent, AIAgentWithKey } from "../types";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getMyAgents(): Promise<AIAgent[]> {
  const { supabase, user } = await getAuthUser();

  if (!user) return [];

  const { data } = await supabase
    .from("ai_agents")
    .select("id, owner_id, name, slug, description, avatar_url, is_active, created_at, updated_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (data as AIAgent[]) ?? [];
}

export async function createAgent({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description?: string;
}): Promise<{ agent: AIAgentWithKey | null; error: string | null }> {
  const { user } = await getAuthUser();
  const admin = createAdminClient();

  if (!user) {
    return { agent: null, error: "Nao autenticado" };
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  if (!slugRegex.test(slug)) {
    return {
      agent: null,
      error: "Slug deve conter apenas letras minusculas, numeros e hifens",
    };
  }

  // Check for slug uniqueness
  const { data: existing } = await admin
    .from("ai_agents")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { agent: null, error: "Este slug ja esta em uso" };
  }

  // Generate API key
  const apiKeyPlain = `aik_${randomBytes(32).toString("hex")}`;
  const apiKeyHash = createHash("sha256").update(apiKeyPlain).digest("hex");

  const { data: agent, error } = await admin
    .from("ai_agents")
    .insert({
      owner_id: user.id,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      api_key_hash: apiKeyHash,
    })
    .select(
      "id, owner_id, name, slug, description, avatar_url, is_active, created_at, updated_at"
    )
    .single();

  if (error) {
    return { agent: null, error: error.message };
  }

  revalidatePath("/settings/agents");

  return {
    agent: { ...(agent as AIAgent), api_key_plain: apiKeyPlain },
    error: null,
  };
}

export async function regenerateAgentKey(
  agentId: string
): Promise<{ apiKey: string | null; error: string | null }> {
  const { user } = await getAuthUser();
  const admin = createAdminClient();

  if (!user) {
    return { apiKey: null, error: "Nao autenticado" };
  }

  // Verify ownership
  const { data: agent } = await admin
    .from("ai_agents")
    .select("id, owner_id")
    .eq("id", agentId)
    .eq("owner_id", user.id)
    .single();

  if (!agent) {
    return { apiKey: null, error: "Agente nao encontrado" };
  }

  const apiKeyPlain = `aik_${randomBytes(32).toString("hex")}`;
  const apiKeyHash = createHash("sha256").update(apiKeyPlain).digest("hex");

  const { error } = await admin
    .from("ai_agents")
    .update({ api_key_hash: apiKeyHash })
    .eq("id", agentId);

  if (error) {
    return { apiKey: null, error: error.message };
  }

  return { apiKey: apiKeyPlain, error: null };
}

export async function toggleAgent(
  agentId: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const { user } = await getAuthUser();
  const admin = createAdminClient();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const { error } = await admin
    .from("ai_agents")
    .update({ is_active: isActive })
    .eq("id", agentId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/agents");
  return { error: null };
}

export async function deleteAgent(
  agentId: string
): Promise<{ error: string | null }> {
  const { user } = await getAuthUser();
  const admin = createAdminClient();

  if (!user) {
    return { error: "Nao autenticado" };
  }

  const { error } = await admin
    .from("ai_agents")
    .delete()
    .eq("id", agentId)
    .eq("owner_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/agents");
  return { error: null };
}
