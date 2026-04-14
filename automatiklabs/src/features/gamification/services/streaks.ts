// =============================================
// Streak System — AutomatikClub
// Track consecutive activity days, award bonus XP
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { STREAK_BONUSES } from "@/shared/utils/constants";
import { awardXP } from "./xp-engine";
import type { StreakInfo } from "../types";

/**
 * Record user activity for today. Updates streak in user_xp.
 * The DB trigger already handles streak increment/reset on xp_transaction insert,
 * but this function additionally awards streak bonus XP at milestones.
 */
export async function recordActivity(userId: string): Promise<void> {
  const supabase = createAdminClient();

  // Get current streak info after the trigger has run
  const { data } = await supabase
    .from("user_xp")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .single();

  if (!data) return;

  const streak = data.current_streak;

  // Award daily streak XP (+5/day)
  const today = new Date().toISOString().split("T")[0];
  await awardXP(userId, "streak", `streak-daily-${today}`, STREAK_BONUSES.daily);

  // Milestone bonuses
  if (streak === 7) {
    await awardXP(
      userId,
      "streak",
      `streak-week-${today}`,
      STREAK_BONUSES.week
    );
  }

  if (streak === 30) {
    await awardXP(
      userId,
      "streak",
      `streak-month-${today}`,
      STREAK_BONUSES.month
    );
  }

  if (streak === 90) {
    await awardXP(
      userId,
      "streak",
      `streak-quarter-${today}`,
      STREAK_BONUSES.quarter
    );
  }
}

/**
 * Get streak info for a user.
 */
export async function getStreakInfo(userId: string): Promise<StreakInfo> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_xp")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      bonusXp: 0,
    };
  }

  // Calculate bonus: daily streak XP earned so far
  const bonusXp = calculateStreakBonus(data.current_streak);

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastActivityDate: data.last_activity_date,
    bonusXp,
  };
}

/**
 * Calculate total streak bonus XP for a given streak length.
 */
function calculateStreakBonus(streak: number): number {
  let bonus = streak * STREAK_BONUSES.daily;
  if (streak >= 7) bonus += STREAK_BONUSES.week;
  if (streak >= 30) bonus += STREAK_BONUSES.month;
  if (streak >= 90) bonus += STREAK_BONUSES.quarter;
  return bonus;
}
