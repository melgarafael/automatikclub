"use server";

import { executePull, execute10Pull } from "../services/gacha-engine";
import type { PullResult } from "../types";

interface PullActionResult {
  results?: PullResult[];
  error?: string;
}

export async function pullSingle(
  bannerId: string
): Promise<PullActionResult> {
  try {
    const results = await executePull(bannerId);
    return { results };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function pull10(
  bannerId: string
): Promise<PullActionResult> {
  try {
    const results = await execute10Pull(bannerId);
    return { results };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
