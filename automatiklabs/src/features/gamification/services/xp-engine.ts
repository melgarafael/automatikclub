// =============================================
// XP Engine — AutomatikClub
// Award XP with deduplication and anti-gaming
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import { XP_VALUES } from "@/shared/utils/constants";
import { validateAntiGaming } from "./anti-gaming";
import type { XpSourceType, AwardXPResult } from "../types";

/**
 * Award XP to a user for a specific action.
 *
 * Deduplication is handled by the DB UNIQUE constraint on (user_id, source_type, source_id).
 * Anti-gaming checks (daily caps, cooldown) are validated before insert.
 *
 * @param userId - The user receiving XP
 * @param sourceType - The type of action (e.g., "lesson_complete")
 * @param sourceId - The entity ID (lesson, module, post, etc.) — used for dedup
 * @param amount - Override the default XP amount (used for challenges with variable XP)
 */
export async function awardXP(
  userId: string,
  sourceType: XpSourceType,
  sourceId: string,
  amount?: number
): Promise<AwardXPResult> {
  const xpAmount =
    amount ?? XP_VALUES[sourceType as keyof typeof XP_VALUES] ?? 0;

  if (xpAmount <= 0) {
    return { success: false, xpAwarded: 0, reason: "invalid_amount" };
  }

  // Anti-gaming validation
  const validation = await validateAntiGaming(userId, sourceType);
  if (!validation.allowed) {
    return { success: false, xpAwarded: 0, reason: validation.reason };
  }

  const supabase = createAdminClient();

  // Build description based on source type
  const description = buildDescription(sourceType, xpAmount);

  // Insert into xp_transactions — UNIQUE constraint handles dedup
  // ON CONFLICT DO NOTHING = if already awarded, silently skip
  const { error } = await supabase.from("xp_transactions").insert({
    user_id: userId,
    amount: xpAmount,
    source_type: sourceType,
    source_id: sourceId,
    description,
  });

  if (error) {
    // Check if it's a unique violation (dedup)
    if (error.code === "23505") {
      return { success: false, xpAwarded: 0, reason: "already_awarded" };
    }
    console.error("[xp-engine] awardXP error:", error.message);
    return { success: false, xpAwarded: 0, reason: error.message };
  }

  // The DB trigger (recalculate_user_xp) automatically updates user_xp table
  return { success: true, xpAwarded: xpAmount };
}

/**
 * Build a human-readable description for the XP transaction.
 */
function buildDescription(sourceType: XpSourceType, amount: number): string {
  const labels: Record<string, string> = {
    lesson_complete: "Aula completa",
    module_complete: "Modulo completo",
    course_complete: "Curso completo",
    track_complete: "Trilha completa",
    rating: "Avaliacao de aula",
    comment: "Comentario",
    post: "Post na comunidade",
    marketplace_upload: "Upload no marketplace aprovado",
    marketplace_review: "Avaliacao positiva recebida",
    challenge: "Desafio concluido",
    contributor_lesson: "Aula de contribuidor aprovada",
    streak: "Bonus de streak",
    daily_login: "Login diario",
    badge_earned: "Badge conquistado",
  };

  return `${labels[sourceType] ?? sourceType} (+${amount} XP)`;
}

/**
 * Get total XP for a user.
 */
export async function getUserTotalXP(
  userId: string
): Promise<{ totalXp: number; level: number }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_xp")
    .select("total_xp, level")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { totalXp: 0, level: 1 };
  }

  return { totalXp: data.total_xp, level: data.level };
}
