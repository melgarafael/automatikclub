"use server";

import { createClient } from "@/shared/lib/supabase/server";
import { getWallet } from "../services/economy-engine";
import type { UserWallet } from "../types";

interface WalletActionResult {
  wallet?: UserWallet;
  error?: string;
}

export async function getUserWalletAction(): Promise<WalletActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Not authenticated" };

    const wallet = await getWallet(user.id);
    return { wallet };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
