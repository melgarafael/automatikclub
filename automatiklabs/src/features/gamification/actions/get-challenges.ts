"use server";

import { createClient } from "@/shared/lib/supabase/server";
import type { Challenge, ChallengeParticipation } from "../types";

/**
 * Fetch challenges with optional status filter.
 */
export async function getChallenges(
  status?: "active" | "completed" | "expired"
): Promise<Challenge[]> {
  const supabase = await createClient();

  let query = supabase
    .from("challenges")
    .select("*, challenge_participations(count)")
    .order("starts_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else {
    // Default: show active and completed
    query = query.in("status", ["active", "completed"]);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    criteriaType: row.criteria_type,
    criteriaValue: row.criteria_value,
    xpReward: row.xp_reward,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    participantCount:
      (row.challenge_participations as unknown as { count: number }[])?.[0]
        ?.count ?? 0,
  }));
}

/**
 * Fetch a single challenge by ID with participant count.
 */
export async function getChallengeById(
  id: string
): Promise<Challenge | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("challenges")
    .select("*, challenge_participations(count)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    criteriaType: data.criteria_type,
    criteriaValue: data.criteria_value,
    xpReward: data.xp_reward,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    status: data.status,
    createdBy: data.created_by,
    createdAt: data.created_at,
    participantCount:
      (data.challenge_participations as unknown as { count: number }[])?.[0]
        ?.count ?? 0,
  };
}

/**
 * Get the current user's participations.
 */
export async function getMyParticipations(): Promise<ChallengeParticipation[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("challenge_participations")
    .select("*")
    .eq("user_id", user.id);

  if (error || !data) return [];

  return data.map((row) => ({
    challengeId: row.challenge_id,
    userId: row.user_id,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
  }));
}
