"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { CommentableType, CommentWithAuthor } from "../types";

export async function getComments(
  commentableType: CommentableType,
  commentableId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      author:user_profiles!comments_author_id_fkey (
        id, full_name, username, role, avatar_url
      ),
      comment_likes!left (
        user_id
      )
    `
    )
    .eq("commentable_type", commentableType)
    .eq("commentable_id", commentableId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (error || !rows) {
    return [];
  }

  // Build threaded structure
  const commentMap = new Map<string, CommentWithAuthor>();
  const rootComments: CommentWithAuthor[] = [];

  for (const row of rows as Array<Record<string, unknown>>) {
    const likes = row.comment_likes as Array<{ user_id: string }> | null;
    const comment: CommentWithAuthor = {
      id: row.id as string,
      commentable_type: row.commentable_type as CommentableType,
      commentable_id: row.commentable_id as string,
      author_id: row.author_id as string,
      parent_id: row.parent_id as string | null,
      content: row.content as string,
      is_ai_response: row.is_ai_response as boolean,
      ai_model: row.ai_model as string | null,
      status: row.status as CommentWithAuthor["status"],
      depth: row.depth as number,
      likes_count: row.likes_count as number,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      author: row.author as CommentWithAuthor["author"],
      user_has_liked: likes?.some((l) => l.user_id === user?.id) ?? false,
      replies: [],
    };
    commentMap.set(comment.id, comment);
  }

  for (const comment of commentMap.values()) {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies.push(comment);
    } else {
      rootComments.push(comment);
    }
  }

  return rootComments;
}
