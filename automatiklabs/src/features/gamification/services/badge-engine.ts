// =============================================
// Badge Engine — AutomatikClub
// Check and award badges based on criteria
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { awardXP } from "./xp-engine";
import type { Badge, BadgeCriteriaType, UserBadge } from "../types";

/**
 * Check all badges the user is eligible for and award any new ones.
 * Called after XP transactions, completions, etc.
 */
export async function checkAndAwardBadges(
  userId: string
): Promise<UserBadge[]> {
  const supabase = createAdminClient();
  const newBadges: UserBadge[] = [];

  // Get all badges
  const { data: badges, error: badgesError } = await supabase
    .from("badges")
    .select("*");

  if (badgesError || !badges) return [];

  // Get badges user already has
  const { data: earned } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earnedIds = new Set((earned ?? []).map((e) => e.badge_id));

  // Get user stats for criteria checks
  const stats = await getUserCriteriaStats(userId);

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    const value = stats[badge.criteria_type as BadgeCriteriaType] ?? 0;
    if (value >= badge.criteria_value) {
      // Award badge
      const { error } = await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });

      if (!error) {
        const awarded: UserBadge = {
          userId,
          badgeId: badge.id,
          earnedAt: new Date().toISOString(),
          badge: mapBadge(badge),
        };
        newBadges.push(awarded);

        // Award XP bonus for badge if configured
        if (badge.xp_reward > 0) {
          await awardXP(
            userId,
            "badge_earned",
            `badge-${badge.id}`,
            badge.xp_reward
          );
        }
      }
    }
  }

  return newBadges;
}

/**
 * Get all badges for a user, both earned and unearned.
 */
export async function getUserBadges(
  userId: string
): Promise<{ earned: UserBadge[]; all: Badge[] }> {
  const supabase = createAdminClient();

  const [badgesResult, earnedResult] = await Promise.all([
    supabase.from("badges").select("*").order("criteria_value", { ascending: true }),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", userId),
  ]);

  const all = (badgesResult.data ?? []).map(mapBadge);
  const earned: UserBadge[] = (earnedResult.data ?? []).map((ub) => ({
    userId: ub.user_id,
    badgeId: ub.badge_id,
    earnedAt: ub.earned_at,
    badge: mapBadge(ub.badge),
  }));

  return { earned, all };
}

// -- Internal helpers --

async function getUserCriteriaStats(
  userId: string
): Promise<Record<BadgeCriteriaType, number>> {
  const supabase = createAdminClient();

  // Total points
  const { data: xpData } = await supabase
    .from("user_xp")
    .select("total_xp, current_streak")
    .eq("user_id", userId)
    .single();

  // Count lessons completed (actual progress, not XP transactions)
  const { count: lessonsCount } = await supabase
    .from("user_lesson_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true);

  // Count courses completed (actual progress)
  const { count: coursesCount } = await supabase
    .from("user_course_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true);

  // Count comments (actual rows in comments table)
  const { count: commentsCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count posts (actual rows in posts table)
  const { count: postsCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  // Count challenges completed
  const { count: challengesCount } = await supabase
    .from("challenge_participations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  // Count marketplace items (actual uploads)
  const { count: marketplaceCount } = await supabase
    .from("marketplace_items")
    .select("*", { count: "exact", head: true })
    .eq("author_id", userId);

  return {
    total_points: xpData?.total_xp ?? 0,
    lessons_completed: lessonsCount ?? 0,
    courses_completed: coursesCount ?? 0,
    comments_posted: commentsCount ?? 0,
    posts_created: postsCount ?? 0,
    challenges_completed: challengesCount ?? 0,
    marketplace_items: marketplaceCount ?? 0,
    streak_days: xpData?.current_streak ?? 0,
  };
}

function mapBadge(raw: Record<string, unknown>): Badge {
  return {
    id: raw.id as string,
    slug: raw.slug as string,
    name: raw.name as string,
    description: (raw.description as string) ?? null,
    iconUrl: (raw.icon_url as string) ?? null,
    criteriaType: raw.criteria_type as BadgeCriteriaType,
    criteriaValue: raw.criteria_value as number,
    xpReward: raw.xp_reward as number,
  };
}
