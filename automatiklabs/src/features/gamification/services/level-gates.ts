// =============================================
// Level Gate System — AutomatikClub
// Infrastructure for level-based feature unlocks.
// No features are ACTUALLY gated yet — this is infrastructure only.
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { getLevelForXP } from "./levels";

// Feature gate configuration
// Add features here as they become gated.
// Currently empty — infrastructure ready.
export const FEATURE_GATES: Record<string, number> = {
  // "community_posts": 3,    // Level 3: Can create posts in community
  // "marketplace": 5,         // Level 5: Can access marketplace
  // "contribute_lessons": 10, // Level 10: Can contribute lessons
};

/**
 * Check if a user has unlocked a specific feature.
 * Returns true if no gate is defined (feature is ungated).
 */
export async function isFeatureUnlocked(
  userId: string,
  featureName: string
): Promise<boolean> {
  const requiredLevel = FEATURE_GATES[featureName];
  if (requiredLevel === undefined) return true; // Not gated

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("user_xp")
    .select("total_xp")
    .eq("user_id", userId)
    .single();

  const userLevel = getLevelForXP(data?.total_xp ?? 0);
  return userLevel.level >= requiredLevel;
}

/**
 * Get the required level for a feature. Returns null if not gated.
 */
export function getFeatureUnlockLevel(featureName: string): number | null {
  return FEATURE_GATES[featureName] ?? null;
}
