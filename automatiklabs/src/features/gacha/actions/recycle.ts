"use server";

import { recycleItem } from "../services/inventory-engine";
import { recycleSchema } from "../schemas";
import { createClient } from "@/shared/lib/supabase/server";
import type { RecycleResult } from "../types";

export type RecycleItemResult = {
  result?: RecycleResult;
  error?: string;
};

export async function recycleItemAction(
  inventoryId: string
): Promise<RecycleItemResult> {
  const parsed = recycleSchema.safeParse({ inventoryId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  try {
    const result = await recycleItem(parsed.data.inventoryId);
    return { result };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erro ao reciclar item" };
  }
}
