import type { UserRole, SubscriptionTier } from "@/features/auth/types";

// ── Channel ──

export type ChannelType = "general" | "course" | "topic";
export type ChannelVisibility = "public" | "members" | "private";
export type ChannelTabType = "discussion" | "resources" | "events";

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  type: ChannelType;
  visibility: ChannelVisibility;
  tier_required: SubscriptionTier;
  position: number;
  is_archived: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChannelTab {
  id: string;
  channel_id: string;
  name: string;
  slug: string;
  type: ChannelTabType;
  position: number;
  created_at: string;
}

// ── Post ──

export type PostStatus = "draft" | "published" | "archived" | "deleted";

export interface Post {
  id: string;
  channel_id: string;
  tab_id: string | null;
  author_id: string;
  title: string | null;
  content_md: string;
  images: string[];
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}

export interface PostAuthor {
  id: string;
  full_name: string;
  username: string;
  role: UserRole;
  avatar_url: string | null;
}

export interface PostWithAuthor extends Post {
  author: PostAuthor;
  channel: Pick<Channel, "id" | "name" | "slug">;
  user_has_liked: boolean;
}

// ── Comment ──

export type CommentableType = "lesson" | "post" | "ai_post";
export type CommentStatus = "pending" | "approved" | "rejected" | "deleted";

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

export interface CommentWithAuthor extends Comment {
  author: PostAuthor;
  user_has_liked: boolean;
  replies: CommentWithAuthor[];
}

// ── Feed ──

export type FeedFilter = "recentes" | "populares" | "seguindo" | "ai-feed";

export interface FeedPage {
  posts: PostWithAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
}
