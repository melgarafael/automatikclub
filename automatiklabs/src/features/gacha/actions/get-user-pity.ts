"use server";

import { getPityState } from "../services/pity-engine";
import type { PityState } from "../types";

interface PityActionResult {
  pity?: PityState;
  error?: string;
}

export async function getUserPityAction(
  bannerId: string
): Promise<PityActionResult> {
  try {
    const pity = await getPityState(bannerId);
    return { pity };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
