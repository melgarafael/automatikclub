// =============================================
// Pity Engine — Pity state queries + rate math
// =============================================

import { createClient } from "@/shared/lib/supabase/server";
import type { PityState } from "../types";

export async function getPityState(
  bannerId: string
): Promise<PityState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_pity")
    .select("user_id, banner_id, pull_count, guaranteed_next")
    .eq("user_id", user.id)
    .eq("banner_id", bannerId)
    .single();

  if (error && error.code === "PGRST116") {
    // No pity row yet — user hasn't pulled on this banner
    return {
      userId: user.id,
      bannerId,
      pullCount: 0,
      guaranteedNext: false,
    };
  }
  if (error) throw new Error(error.message);

  return {
    userId: data.user_id,
    bannerId: data.banner_id,
    pullCount: data.pull_count,
    guaranteedNext: data.guaranteed_next,
  };
}

/**
 * Calculate effective rate for a rarity given pity state.
 *
 * Used for client-side display ("Your current Legendary rate: X%").
 * The actual roll happens server-side in the RPC.
 */
export function calculateEffectiveRate(
  baseRate: number,
  pullCount: number,
  softStart: number,
  hardPity: number
): number {
  if (pullCount >= hardPity) return 1.0;

  if (pullCount >= softStart) {
    const progress =
      (pullCount - softStart) / (hardPity - softStart);
    return baseRate + progress * (1.0 - baseRate);
  }

  return baseRate;
}
