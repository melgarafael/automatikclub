"use server";

import { createClient } from "@/shared/lib/supabase/server";
import {
  getRecommendationsForUser,
  getPopularLessons,
} from "../services/recommendation-engine";
import type { RecommendedItem } from "../types";

/**
 * Get top 10 personalized recommendations for the current user.
 * Falls back to popular lessons if user is not authenticated.
 */
export async function getRecommendations(
  limit: number = 10
): Promise<RecommendedItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return getPopularLessons(limit);
  }

  return getRecommendationsForUser(user.id, limit);
}
