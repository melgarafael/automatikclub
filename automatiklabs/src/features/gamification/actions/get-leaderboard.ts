"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { getLevelProgress } from "../services/levels";
import type { LeaderboardEntry, LeaderboardPeriod } from "../types";

/**
 * Fetch leaderboard data for a given period.
 * Uses user_xp table with XP totals (updated via trigger).
 * For weekly/monthly, queries xp_transactions directly with date filter.
 */
export async function getLeaderboard(
  period: LeaderboardPeriod,
  limit = 100
): Promise<{ entries: LeaderboardEntry[]; currentUserEntry: LeaderboardEntry | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let entries: LeaderboardEntry[];

  if (period === "alltime") {
    entries = await getAllTimeLeaderboard(limit);
  } else {
    entries = await getPeriodLeaderboard(period, limit);
  }

  // Find current user in entries
  let currentUserEntry: LeaderboardEntry | null = null;
  if (user) {
    currentUserEntry =
      entries.find((e) => e.userId === user.id) ?? null;

    // If current user not in top N, fetch their position separately
    if (!currentUserEntry) {
      currentUserEntry = await getUserPosition(user.id, period);
    }

    // Mark current user
    entries = entries.map((e) => ({
      ...e,
      isCurrentUser: e.userId === user.id,
    }));
  }

  return { entries, currentUserEntry };
}

async function getAllTimeLeaderboard(
  limit: number
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_xp")
    .select(
      `
      user_id,
      total_xp,
      level,
      user_profiles!inner(display_name, avatar_url)
    `
    )
    .order("total_xp", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row, index) => {
    const profile = row.user_profiles as unknown as {
      display_name: string;
      avatar_url: string | null;
    };
    return {
      userId: row.user_id,
      displayName: profile.display_name ?? "Usuario",
      avatarUrl: profile.avatar_url ?? null,
      totalXp: row.total_xp,
      rank: index + 1,
      level: getLevelProgress(row.total_xp).level,
    };
  });
}

async function getPeriodLeaderboard(
  period: "weekly" | "monthly",
  limit: number
): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();

  const now = new Date();
  let startDate: Date;

  if (period === "weekly") {
    // Start of current week (Monday)
    const day = now.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    startDate = new Date(now);
    startDate.setUTCDate(now.getUTCDate() - diff);
    startDate.setUTCHours(0, 0, 0, 0);
  } else {
    // Start of current month
    startDate = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  }

  // Use RPC or raw query to aggregate XP by period
  // Since we cannot use raw SQL from client, we query xp_transactions
  const { data, error } = await supabase
    .from("xp_transactions")
    .select("user_id, amount")
    .gte("created_at", startDate.toISOString());

  if (error || !data) return [];

  // Aggregate by user
  const userTotals = new Map<string, number>();
  for (const row of data) {
    userTotals.set(
      row.user_id,
      (userTotals.get(row.user_id) ?? 0) + row.amount
    );
  }

  // Sort and take top N
  const sorted = Array.from(userTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0) return [];

  // Fetch user profiles
  const userIds = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  return sorted.map(([userId, totalXp], index) => {
    const profile = profileMap.get(userId);
    return {
      userId,
      displayName: profile?.display_name ?? "Usuario",
      avatarUrl: profile?.avatar_url ?? null,
      totalXp,
      rank: index + 1,
      level: getLevelProgress(totalXp).level,
    };
  });
}

async function getUserPosition(
  userId: string,
  period: LeaderboardPeriod
): Promise<LeaderboardEntry | null> {
  const supabase = await createClient();

  if (period === "alltime") {
    const { data } = await supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", userId)
      .single();

    if (!data) return null;

    // Count users with more XP to determine rank
    const { count } = await supabase
      .from("user_xp")
      .select("*", { count: "exact", head: true })
      .gt("total_xp", data.total_xp);

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();

    return {
      userId,
      displayName: profile?.display_name ?? "Voce",
      avatarUrl: profile?.avatar_url ?? null,
      totalXp: data.total_xp,
      rank: (count ?? 0) + 1,
      level: getLevelProgress(data.total_xp).level,
      isCurrentUser: true,
    };
  }

  // For period rankings, approximate position
  return null;
}
