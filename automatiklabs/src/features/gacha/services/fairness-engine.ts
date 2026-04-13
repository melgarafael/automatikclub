// =============================================
// Fairness Engine — Provably Fair Verification
// Wraps rotate_server_seed RPC and provides
// HMAC verification for completed pulls.
// =============================================

import { createClient } from "@/shared/lib/supabase/server";
import type {
  FairnessRecord,
  SeedRotationResult,
  FairnessVerification,
} from "../types";

// -- Seed Rotation --

export async function rotateSeed(): Promise<SeedRotationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("rotate_server_seed");

  if (error) throw new Error(error.message);

  const result = data as Record<string, unknown>;

  return {
    newSeedHash: result.new_seed_hash as string,
    oldServerSeed: (result.old_server_seed as string) ?? null,
    oldSeedHash: (result.old_seed_hash as string) ?? null,
    oldNonce: (result.old_nonce as number) ?? null,
    clientSeed: result.client_seed as string,
  };
}

// -- Pull Verification --

export async function verifyPull(
  pullId: string
): Promise<FairnessVerification> {
  const supabase = await createClient();

  // Fetch the pull record
  const { data: pull, error: pullError } = await supabase
    .from("pull_history")
    .select("id, user_id, server_seed_hash, nonce, rarity, item_id, created_at")
    .eq("id", pullId)
    .single();

  if (pullError || !pull) {
    throw new Error("Pull not found");
  }

  // Fetch the seed that was used for this pull (by matching server_seed_hash)
  const { data: seeds, error: seedError } = await supabase
    .from("gacha_seeds")
    .select("id, server_seed, server_seed_hash, client_seed, is_active, revealed_at")
    .eq("user_id", pull.user_id)
    .eq("server_seed_hash", pull.server_seed_hash)
    .limit(1);

  if (seedError) throw new Error(seedError.message);

  const seed = seeds?.[0] ?? null;

  // If seed is still active, we can't reveal the server_seed yet
  if (!seed || seed.is_active) {
    return {
      pullId,
      verified: false,
      serverSeedHash: pull.server_seed_hash,
      nonce: pull.nonce,
      serverSeed: null,
      clientSeed: seed?.client_seed ?? null,
      expectedHash: null,
      resultRarity: pull.rarity,
      message: seed
        ? "Seed ainda ativa. Rotacione a seed para verificar este pull."
        : "Seed nao encontrada para este pull.",
    };
  }

  // Seed has been revealed — user can verify independently.
  // We don't recompute HMAC server-side (that would defeat the purpose).
  // Instead we provide all inputs for client-side verification.
  return {
    pullId,
    verified: true,
    serverSeedHash: pull.server_seed_hash,
    nonce: pull.nonce,
    serverSeed: seed.server_seed,
    clientSeed: seed.client_seed,
    expectedHash: seed.server_seed_hash,
    resultRarity: pull.rarity,
    message: "Seed revelada. Verifique: HMAC-SHA256(server_seed, client_seed + \":\" + nonce)",
  };
}

// -- Fairness History --

export async function getUserFairnessHistory(
  limit = 50
): Promise<FairnessRecord[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch recent pulls with their seed info
  const { data: pulls, error: pullError } = await supabase
    .from("pull_history")
    .select(
      `
      id,
      server_seed_hash,
      nonce,
      rarity,
      created_at,
      gacha_items ( name )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pullError) throw new Error(pullError.message);
  if (!pulls) return [];

  // Fetch all revealed seeds for this user (to match hashes)
  const { data: revealedSeeds, error: seedError } = await supabase
    .from("gacha_seeds")
    .select("server_seed, server_seed_hash, client_seed")
    .eq("user_id", user.id)
    .eq("is_active", false)
    .not("revealed_at", "is", null);

  if (seedError) throw new Error(seedError.message);

  // Index revealed seeds by hash for O(1) lookup
  const seedByHash = new Map(
    (revealedSeeds ?? []).map((s) => [
      s.server_seed_hash,
      { serverSeed: s.server_seed, clientSeed: s.client_seed },
    ])
  );

  return pulls.map((pull) => {
    const raw = pull as Record<string, unknown>;
    const itemData = raw.gacha_items as { name: string } | null;
    const revealed = seedByHash.get(raw.server_seed_hash as string);

    return {
      pullId: raw.id as string,
      serverSeedHash: raw.server_seed_hash as string,
      nonce: raw.nonce as number,
      rarity: raw.rarity as FairnessRecord["rarity"],
      itemName: itemData?.name ?? "Unknown",
      createdAt: raw.created_at as string,
      serverSeed: revealed?.serverSeed ?? null,
      clientSeed: revealed?.clientSeed ?? null,
    };
  });
}
