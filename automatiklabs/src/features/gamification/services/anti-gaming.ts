// =============================================
// Anti-Gaming System — AutomatikClub
// Daily caps, cooldown, deduplication
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { DAILY_CAPS, COOLDOWN_SECONDS } from "@/shared/utils/constants";
import type { XpSourceType } from "../types";

/**
 * Checks if the user has hit their daily cap for a given source type.
 * Returns true if the user CAN still earn XP, false if capped.
 */
export async function checkDailyLimit(
  userId: string,
  sourceType: XpSourceType
): Promise<boolean> {
  const cap = DAILY_CAPS[sourceType];
  if (!cap) return true; // No daily cap for this source type

  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("xp_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source_type", sourceType)
    .gte("created_at", todayStart.toISOString());

  if (error) {
    console.error("[anti-gaming] checkDailyLimit error:", error.message);
    return false; // Fail closed — deny XP on error
  }

  return (count ?? 0) < cap;
}

/**
 * Checks cooldown — ensures at least COOLDOWN_SECONDS between same-type actions.
 * Returns true if cooldown has passed, false if too soon.
 */
export async function checkCooldown(
  userId: string,
  sourceType: XpSourceType
): Promise<boolean> {
  // Only apply cooldown to capped source types
  if (!DAILY_CAPS[sourceType]) return true;

  const supabase = createAdminClient();
  const cooldownThreshold = new Date(
    Date.now() - COOLDOWN_SECONDS * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("xp_transactions")
    .select("created_at")
    .eq("user_id", userId)
    .eq("source_type", sourceType)
    .gte("created_at", cooldownThreshold)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[anti-gaming] checkCooldown error:", error.message);
    return false; // Fail closed
  }

  return !data || data.length === 0;
}

/**
 * Combined anti-gaming check: daily limit + cooldown.
 * Returns { allowed: boolean, reason?: string }.
 */
export async function validateAntiGaming(
  userId: string,
  sourceType: XpSourceType
): Promise<{ allowed: boolean; reason?: string }> {
  const withinCap = await checkDailyLimit(userId, sourceType);
  if (!withinCap) {
    return { allowed: false, reason: "daily_cap_reached" };
  }

  const cooldownOk = await checkCooldown(userId, sourceType);
  if (!cooldownOk) {
    return { allowed: false, reason: "cooldown_active" };
  }

  return { allowed: true };
}
