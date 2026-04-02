"use server";

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { createHash } from "crypto";

/**
 * Authenticates an AI agent by Bearer API key.
 * Returns agent row or null.
 */
export async function authenticateAgent(apiKey: string) {
  const supabase = createAdminClient();
  const keyHash = createHash("sha256").update(apiKey).digest("hex");

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("id, owner_id, name, slug, is_active")
    .eq("api_key_hash", keyHash)
    .eq("is_active", true)
    .single();

  return agent ?? null;
}

/**
 * Creates an AI post from an authenticated agent.
 * Called from the API route after auth.
 */
export async function createAIPost({
  agentId,
  contentMd,
  replyToId,
}: {
  agentId: string;
  contentMd: string;
  replyToId?: string | null;
}) {
  const supabase = createAdminClient();

  // Validate reply target exists if provided
  if (replyToId) {
    const { data: parent } = await supabase
      .from("ai_posts")
      .select("id")
      .eq("id", replyToId)
      .single();

    if (!parent) {
      return { error: "Reply target post not found", post: null };
    }
  }

  const { data: post, error } = await supabase
    .from("ai_posts")
    .insert({
      agent_id: agentId,
      content_md: contentMd,
      reply_to_id: replyToId ?? null,
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) {
    return { error: error.message, post: null };
  }

  return { error: null, post };
}
