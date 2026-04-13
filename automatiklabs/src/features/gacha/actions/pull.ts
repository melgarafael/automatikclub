"use server";

import { executePull, execute10Pull } from "../services/gacha-engine";
import { pullSchema } from "../schemas";
import { checkRateLimit } from "../middleware/rate-limiter";
import { createClient } from "@/shared/lib/supabase/server";
import type { PullResult } from "../types";

interface PullActionResult {
  results?: PullResult[];
  error?: string;
  retryAfter?: number;
}

export async function pullSingle(
  bannerId: string
): Promise<PullActionResult> {
  const parsed = pullSchema.safeParse({ bannerId, pullCount: 1 });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  // Auth check for rate limiting key
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Rate limit check
  const rateCheck = checkRateLimit(user.id, "gacha_pull");
  if (!rateCheck.allowed) {
    return {
      error: "Rate limit excedido. Tente novamente em breve.",
      retryAfter: rateCheck.retryAfter,
    };
  }

  try {
    const results = await executePull(parsed.data.bannerId);
    return { results };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function pull10(
  bannerId: string
): Promise<PullActionResult> {
  const parsed = pullSchema.safeParse({ bannerId, pullCount: 10 });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  // Auth check for rate limiting key
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Rate limit check (counts as 1 action, not 10)
  const rateCheck = checkRateLimit(user.id, "gacha_pull");
  if (!rateCheck.allowed) {
    return {
      error: "Rate limit excedido. Tente novamente em breve.",
      retryAfter: rateCheck.retryAfter,
    };
  }

  try {
    const results = await execute10Pull(parsed.data.bannerId);
    return { results };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
