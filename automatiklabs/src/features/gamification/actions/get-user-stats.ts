"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { getLevelProgress } from "../services/levels";
import { getStreakInfo } from "../services/streaks";
import { getUserBadges } from "../services/badge-engine";
import type { UserStats } from "../types";

/**
 * Get complete gamification stats for a user:
 * XP, level progress, streak, badges, rank.
 */
export async function getUserStats(userId?: string): Promise<UserStats | null> {
  const supabase = await createClient();

  // If no userId, use current user
  let targetUserId = userId;
  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    targetUserId = user.id;
  }

  // Fetch user_xp
  const { data: xpData } = await supabase
    .from("user_xp")
    .select("total_xp, level, current_streak, longest_streak, last_activity_date")
    .eq("user_id", targetUserId)
    .single();

  const totalXp = xpData?.total_xp ?? 0;

  // Level progress
  const level = getLevelProgress(totalXp);

  // Streak info
  const streak = await getStreakInfo(targetUserId);

  // Badges
  const { earned } = await getUserBadges(targetUserId);

  // Rank (count users with more XP)
  const { count } = await supabase
    .from("user_xp")
    .select("*", { count: "exact", head: true })
    .gt("total_xp", totalXp);

  const rank = totalXp > 0 ? (count ?? 0) + 1 : null;

  return {
    totalXp,
    level,
    streak,
    badges: earned,
    rank,
  };
}
