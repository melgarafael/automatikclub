export type UserRole = "member" | "contributor" | "moderator" | "admin";

export type SubscriptionTier = "free" | "pro" | "team";

export type ContentType = "post" | "lesson" | "course" | "track";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  tier: SubscriptionTier;
  xp: number;
  streak: number;
  level: number;
  avatarUrl: string | null;
  createdAt: string;
}
