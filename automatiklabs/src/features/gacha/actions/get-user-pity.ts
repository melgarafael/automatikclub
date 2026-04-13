"use server";

import { getPityState } from "../services/pity-engine";
import { createClient } from "@/shared/lib/supabase/server";
import type { PityState } from "../types";

interface PityActionResult {
  pity?: PityState;
  error?: string;
}

export async function getUserPityAction(
  bannerId: string
): Promise<PityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const pity = await getPityState(bannerId);
    return { pity };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
