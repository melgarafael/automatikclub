"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { FeedFilter, PostWithAuthor } from "../types";

const PAGE_SIZE = 20;

interface GetFeedOptions {
  filter: FeedFilter;
  cursor?: string | null;
  channelId?: string | null;
}

export async function getFeed({ filter, cursor, channelId }: GetFeedOptions) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      author:user_profiles!posts_author_id_fkey (
        id, full_name, username, role, avatar_url
      ),
      channel:channels!posts_channel_id_fkey (
        id, name, slug
      ),
      post_likes!left (
        user_id
      )
    `
    )
    .eq("status", "published");

  // Filter by channel if specified
  if (channelId) {
    query = query.eq("channel_id", channelId);
  }

  // Apply filter-specific sorting
  switch (filter) {
    case "populares":
      query = query.order("likes_count", { ascending: false });
      break;
    case "ai-feed":
      // AI posts are from authors with role that would indicate AI
      // For now, filter by posts that might be AI-generated
      // This is a simplification; real AI feed would have a separate flag
      break;
    case "seguindo":
      // Future: filter by channels user follows
      break;
    case "recentes":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Cursor-based pagination
  if (cursor) {
    if (filter === "populares") {
      query = query.lt("likes_count", parseInt(cursor, 10));
    } else {
      query = query.lt("created_at", cursor);
    }
  }

  query = query.limit(PAGE_SIZE + 1);

  const { data: rows, error } = await query;

  if (error || !rows) {
    return { posts: [], nextCursor: null, hasMore: false };
  }

  const hasMore = rows.length > PAGE_SIZE;
  const sliced = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  const posts: PostWithAuthor[] = sliced.map((row: Record<string, unknown>) => {
    const likes = row.post_likes as Array<{ user_id: string }> | null;
    return {
      id: row.id as string,
      channel_id: row.channel_id as string,
      tab_id: row.tab_id as string | null,
      author_id: row.author_id as string,
      title: row.title as string | null,
      content_md: row.content_md as string,
      images: (row.images as string[]) ?? [],
      is_pinned: row.is_pinned as boolean,
      likes_count: row.likes_count as number,
      comments_count: row.comments_count as number,
      status: row.status as PostWithAuthor["status"],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      author: row.author as PostWithAuthor["author"],
      channel: row.channel as PostWithAuthor["channel"],
      user_has_liked: likes?.some((l) => l.user_id === user.id) ?? false,
    };
  });

  const lastPost = sliced[sliced.length - 1] as Record<string, unknown> | undefined;
  const nextCursor = hasMore && lastPost
    ? filter === "populares"
      ? String(lastPost.likes_count)
      : (lastPost.created_at as string)
    : null;

  return { posts, nextCursor, hasMore };
}
