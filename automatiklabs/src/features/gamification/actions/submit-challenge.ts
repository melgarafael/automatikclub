"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { awardXP } from "../services/xp-engine";
import { checkAndAwardBadges } from "../services/badge-engine";
import { revalidatePath } from "next/cache";

export type SubmitChallengeState = {
  success?: boolean;
  error?: string;
  xpAwarded?: number;
};

/**
 * Mark a challenge as completed for the current user.
 * Awards the challenge's XP reward.
 */
export async function submitChallenge(
  challengeId: string
): Promise<SubmitChallengeState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Verify participation exists
  const { data: participation, error: partError } = await supabase
    .from("challenge_participations")
    .select("challenge_id, user_id, completed_at")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .single();

  if (partError || !participation) {
    return { error: "Voce nao esta participando deste desafio" };
  }

  if (participation.completed_at) {
    return { error: "Voce ja completou este desafio" };
  }

  // Get challenge info for XP reward
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, xp_reward, status, ends_at")
    .eq("id", challengeId)
    .single();

  if (!challenge) {
    return { error: "Desafio nao encontrado" };
  }

  if (challenge.status !== "active") {
    return { error: "Este desafio nao esta mais ativo" };
  }

  if (new Date(challenge.ends_at) < new Date()) {
    return { error: "O prazo deste desafio ja expirou" };
  }

  // Mark as completed using admin client (bypasses RLS)
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("challenge_participations")
    .update({ completed_at: new Date().toISOString() })
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[submit-challenge] Error:", updateError.message);
    return { error: "Erro ao submeter desafio" };
  }

  // Award XP
  const result = await awardXP(
    user.id,
    "challenge",
    `challenge-${challengeId}`,
    challenge.xp_reward
  );

  // Check for new badges
  await checkAndAwardBadges(user.id);

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);

  return {
    success: true,
    xpAwarded: result.xpAwarded,
  };
}
