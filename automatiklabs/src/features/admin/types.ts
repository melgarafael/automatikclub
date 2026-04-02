// =============================================
// Admin Types — AutomatikClub
// =============================================

import type { UserRole } from "@/shared/lib/auth/roles";
import type { SubscriptionTier } from "@/shared/lib/auth/subscriptions";

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  coursesPublished: number;
  lessonsTotal: number;
  postsToday: number;
  pendingApprovals: number;
}

export interface PendingCounts {
  comments: number;
  marketplace: number;
  aiFeed: number;
  contributorLessons: number;
}

export interface WeeklyStats {
  newUsersThisWeek: number;
  xpDistributed: number;
  topCourses: { title: string; enrollments: number }[];
}

export interface AdminUser {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: UserRole;
  tier: SubscriptionTier;
  xp: number;
  avatar_url: string | null;
  created_at: string;
}

export interface AdminActionState {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
}

export interface PlatformSettings {
  auto_approve_comments: boolean;
  ai_responses_enabled: boolean;
  ai_response_delay_ms: number;
  ai_model: string;
  default_tier: SubscriptionTier;
}
