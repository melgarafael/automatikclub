// =============================================
// Economy Engine — Fragment & Credit management
// =============================================

import { createAdminClient } from "@/shared/lib/supabase/admin";
import type { UserWallet, CurrencyTxType } from "../types";
import {
  GACHA_FRAGMENT_REWARDS,
  DIMINISHING_THRESHOLD,
  DIMINISHING_CUTOFF,
  DIMINISHING_FACTOR,
  SOFT_CEILING,
  XP_MILESTONE_CREDITS,
} from "../constants";

// -- Wallet --

export async function getWallet(userId: string): Promise<UserWallet> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_wallets")
    .select("user_id, fragments, credits")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // Not found — return zeroed wallet (auto-created on first pull by RPC)
    return { userId, fragments: 0, credits: 0 };
  }
  if (error) throw new Error(error.message);

  return {
    userId: data.user_id,
    fragments: data.fragments,
    credits: data.credits,
  };
}

// -- Award Fragments (system/admin — bypasses RLS) --

export async function awardFragments(
  userId: string,
  amount: number,
  source: CurrencyTxType,
  description?: string
): Promise<void> {
  if (amount <= 0) return;

  const supabase = createAdminClient();

  // Read current balance
  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("fragments")
    .eq("user_id", userId)
    .single();

  let newBalance: number;

  if (!wallet) {
    // Create wallet with initial amount
    await supabase.from("user_wallets").insert({
      user_id: userId,
      fragments: amount,
      credits: 0,
    });
    newBalance = amount;
  } else {
    newBalance = wallet.fragments + amount;
    await supabase
      .from("user_wallets")
      .update({ fragments: newBalance })
      .eq("user_id", userId);
  }
  await supabase.from("currency_transactions").insert({
    user_id: userId,
    currency: "fragments",
    amount,
    tx_type: source,
    description: description ?? `Reward: +${amount} fragments`,
    balance_after: newBalance,
  });
}

// -- Award Credits (system/admin) --

export async function awardCredits(
  userId: string,
  amount: number,
  source: CurrencyTxType,
  description?: string
): Promise<void> {
  if (amount <= 0) return;

  const supabase = createAdminClient();

  const { data: wallet } = await supabase
    .from("user_wallets")
    .select("credits")
    .eq("user_id", userId)
    .single();

  if (!wallet) {
    await supabase.from("user_wallets").insert({
      user_id: userId,
      fragments: 0,
      credits: amount,
    });
  } else {
    await supabase
      .from("user_wallets")
      .update({ credits: wallet.credits + amount })
      .eq("user_id", userId);
  }

  const newBalance = (wallet?.credits ?? 0) + amount;
  await supabase.from("currency_transactions").insert({
    user_id: userId,
    currency: "credits",
    amount,
    tx_type: source,
    description: description ?? `Reward: +${amount} credits`,
    balance_after: newBalance,
  });
}

// -- XP Milestone → Credits --

export async function convertXpMilestone(
  userId: string,
  milestone: number
): Promise<void> {
  const credits = XP_MILESTONE_CREDITS[milestone];
  if (!credits) return;

  await awardCredits(
    userId,
    credits,
    "xp_conversion",
    `XP milestone ${milestone} → +${credits} credits`
  );
}

// -- Fragment Reward Lookup --

export function getFragmentRewardForAction(
  action: keyof typeof GACHA_FRAGMENT_REWARDS
): number {
  const value = GACHA_FRAGMENT_REWARDS[action];
  if (Array.isArray(value)) {
    // daily_login returns array for 7-day cycle — caller picks day index
    return value[0];
  }
  return value as number;
}

// -- Diminishing Returns Check --

export async function getDailyRewardCount(
  userId: string
): Promise<number> {
  const supabase = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("currency_transactions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("currency", "fragments")
    .eq("tx_type", "reward")
    .gte("created_at", todayStart.toISOString());

  if (error) throw new Error(error.message);

  return count ?? 0;
}

export function calculateDiminishedReward(
  baseAmount: number,
  dailyCount: number,
  currentBalance: number
): number {
  // Soft ceiling: no passive bonus above threshold
  if (currentBalance >= SOFT_CEILING) return 0;

  // Beyond cutoff: no reward
  if (dailyCount >= DIMINISHING_CUTOFF) return 0;

  // Diminishing range: halved reward
  if (dailyCount >= DIMINISHING_THRESHOLD) {
    return Math.floor(baseAmount * DIMINISHING_FACTOR);
  }

  return baseAmount;
}
