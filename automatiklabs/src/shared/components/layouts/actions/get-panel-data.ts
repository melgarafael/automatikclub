"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { getLevelProgress } from "@/features/gamification/services/levels";

export interface PanelLeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalXp: number;
  level: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface PanelActiveUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  updatedAt: string;
}

export interface PanelStreak {
  currentStreak: number;
  bonusPercent: number;
}

export interface RightPanelData {
  leaderboard: PanelLeaderboardEntry[];
  activeUsers: PanelActiveUser[];
  activeCount: number;
  streak: PanelStreak;
  currentUserId: string | null;
}

/**
 * Fetches all data needed by the right panel in a single server action:
 * - Top 10 leaderboard (weekly, from user_xp)
 * - Recently active users (from user_profiles.updated_at)
 * - Current user streak
 */
export async function getRightPanelData(): Promise<RightPanelData> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const currentUserId = authUser?.id ?? null;

  // Parallel fetch: leaderboard, active users, streak, active count
  const [leaderboardResult, activeResult, streakResult, countResult] =
    await Promise.all([
      // Top 10 by total XP
      supabase
        .from("user_xp")
        .select(
          `
          user_id,
          total_xp,
          level,
          user_profiles!inner(full_name, avatar_url)
        `
        )
        .order("total_xp", { ascending: false })
        .limit(10),

      // Recently active users
      supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, updated_at")
        .order("updated_at", { ascending: false })
        .limit(10),

      // Current user streak
      currentUserId
        ? supabase
            .from("user_xp")
            .select("current_streak")
            .eq("user_id", currentUserId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      // Total recently active users count (updated in last 24h)
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte(
          "updated_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

  // Parse leaderboard
  const leaderboard: PanelLeaderboardEntry[] = (
    leaderboardResult.data ?? []
  ).map((row, index) => {
    const profile = row.user_profiles as unknown as {
      full_name: string;
      avatar_url: string | null;
    };
    return {
      userId: row.user_id,
      displayName: profile.full_name ?? "Usuario",
      avatarUrl: profile.avatar_url ?? null,
      totalXp: row.total_xp,
      level: getLevelProgress(row.total_xp).level,
      rank: index + 1,
      isCurrentUser: row.user_id === currentUserId,
    };
  });

  // Parse active users — exclude current user to avoid duplication
  const activeUsers: PanelActiveUser[] = (activeResult.data ?? [])
    .filter((row) => row.id !== currentUserId)
    .slice(0, 10)
    .map((row) => ({
      id: row.id,
      displayName: row.full_name ?? "Usuario",
      avatarUrl: row.avatar_url ?? null,
      updatedAt: row.updated_at,
    }));

  // Calculate streak bonus
  const currentStreak = streakResult.data?.current_streak ?? 0;
  let bonusPercent = 0;
  if (currentStreak >= 90) bonusPercent = 30;
  else if (currentStreak >= 30) bonusPercent = 25;
  else if (currentStreak >= 7) bonusPercent = 15;
  else if (currentStreak >= 3) bonusPercent = 5;

  return {
    leaderboard,
    activeUsers,
    activeCount: countResult.count ?? 0,
    streak: { currentStreak, bonusPercent },
    currentUserId,
  };
}
