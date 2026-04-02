"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type JoinChallengeState = {
  success?: boolean;
  error?: string;
};

/**
 * Enroll the current user in a challenge.
 */
export async function joinChallenge(
  challengeId: string
): Promise<JoinChallengeState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Voce precisa estar logado" };
  }

  // Verify challenge exists and is active
  const { data: challenge, error: challengeError } = await supabase
    .from("challenges")
    .select("id, status, ends_at")
    .eq("id", challengeId)
    .single();

  if (challengeError || !challenge) {
    return { error: "Desafio nao encontrado" };
  }

  if (challenge.status !== "active") {
    return { error: "Este desafio nao esta ativo" };
  }

  if (new Date(challenge.ends_at) < new Date()) {
    return { error: "O prazo deste desafio ja expirou" };
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("challenge_participations")
    .select("challenge_id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return { error: "Voce ja esta participando deste desafio" };
  }

  // Enroll
  const { error } = await supabase.from("challenge_participations").insert({
    challenge_id: challengeId,
    user_id: user.id,
  });

  if (error) {
    console.error("[join-challenge] Error:", error.message);
    return { error: "Erro ao participar do desafio" };
  }

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);

  return { success: true };
}
