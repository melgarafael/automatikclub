export type UserRole = "aluno" | "contribuidor" | "moderador" | "admin";
export type AuthProvider = "email" | "google" | "github";
export type SubscriptionTier = "free" | "pro" | "premium";
export type ProfileVisibility = "public" | "members" | "private";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  username: string;
  role: UserRole;
  subscription_level: SubscriptionTier;
  avatar_url: string | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  portfolio_url: string | null;
  stack: string[];
  xp: number;
  level: number;
  streak: number;
  profile_visibility: ProfileVisibility;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: UserRole;
  subscription_level: SubscriptionTier;
  avatar_url: string | null;
  bio: string | null;
  whatsapp: string | null;
  instagram: string | null;
  portfolio_url: string | null;
  stack: string[];
  xp: number;
  level: number;
  streak: number;
  profile_visibility: ProfileVisibility;
  created_at: string;
  updated_at: string;
}
