import type { UserRole } from "@/features/auth/types";

// ── Enums matching DB schema ──

export type CommentableType = "lesson" | "post" | "ai_post";
export type CommentStatus = "pending" | "approved" | "rejected" | "deleted";

// ── Comment author (joined from user_profiles) ──

export interface CommentAuthor {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  avatar_url: string | null;
}

// ── DB row ──

export interface Comment {
  id: string;
  commentable_type: CommentableType;
  commentable_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_ai_response: boolean;
  ai_model: string | null;
  status: CommentStatus;
  depth: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

// ── Enriched comment with author + like state + nested replies ──

export interface CommentWithAuthor extends Comment {
  author: CommentAuthor;
  user_has_liked: boolean;
  replies: CommentWithAuthor[];
}

// ── Action states ──

export type CreateCommentState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export type ModerateCommentState = {
  error?: string;
  success?: boolean;
};

// ── Pending comment for moderation queue ──

export interface PendingComment extends Comment {
  author: CommentAuthor;
  commentable_label: string;
}
