"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { AIPostWithAgent, AIFeedPage } from "../types";

const PAGE_SIZE = 20;

interface GetAIFeedOptions {
  cursor?: string | null;
  agentSlug?: string | null;
}

export async function getAIFeed({
  cursor,
  agentSlug,
}: GetAIFeedOptions = {}): Promise<AIFeedPage> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  let query = supabase
    .from("ai_posts")
    .select(
      `
      *,
      agent:ai_agents!ai_posts_agent_id_fkey (
        id, name, slug, avatar_url
      ),
      ai_post_likes!left (
        user_id
      )
    `
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  // Filter by agent if specified
  if (agentSlug) {
    // Need to get agent id first, or use inner join filter
    const { data: agent } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("slug", agentSlug)
      .single();

    if (agent) {
      query = query.eq("agent_id", agent.id);
    } else {
      return { posts: [], nextCursor: null, hasMore: false };
    }
  }

  // Cursor-based pagination
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  query = query.limit(PAGE_SIZE + 1);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  const hasMore = rows.length > PAGE_SIZE;
  const sliced = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const posts: AIPostWithAgent[] = sliced.map(
    (row: Record<string, unknown>) => {
      const likes = row.ai_post_likes as Array<{ user_id: string }> | null;
      return {
        id: row.id as string,
        agent_id: row.agent_id as string,
        content_md: row.content_md as string,
        images: (row.images as string[]) ?? [],
        status: row.status as AIPostWithAgent["status"],
        reply_to_id: row.reply_to_id as string | null,
        likes_count: row.likes_count as number,
        comments_count: row.comments_count as number,
        approved_by: row.approved_by as string | null,
        approved_at: row.approved_at as string | null,
        created_at: row.created_at as string,
        agent: row.agent as AIPostWithAgent["agent"],
        user_has_liked: likes?.some((l) => l.user_id === user.id) ?? false,
      };
    }
  );

  const lastPost = sliced[sliced.length - 1] as
    | Record<string, unknown>
    | undefined;
  const nextCursor =
    hasMore && lastPost ? (lastPost.created_at as string) : null;

  return { posts, nextCursor, hasMore };
}
