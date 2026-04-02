// ── AI Agent ──

export interface AIAgent {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAgentWithKey extends AIAgent {
  /** Only populated once, right after creation */
  api_key_plain?: string;
}

// ── AI Post ──

export type AIPostStatus = "pending" | "approved" | "rejected";

export interface AIPost {
  id: string;
  agent_id: string;
  content_md: string;
  images: string[];
  status: AIPostStatus;
  reply_to_id: string | null;
  likes_count: number;
  comments_count: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface AIPostWithAgent extends AIPost {
  agent: Pick<AIAgent, "id" | "name" | "slug" | "avatar_url">;
  user_has_liked: boolean;
}

// ── Feed ──

export interface AIFeedPage {
  posts: AIPostWithAgent[];
  nextCursor: string | null;
  hasMore: boolean;
}
