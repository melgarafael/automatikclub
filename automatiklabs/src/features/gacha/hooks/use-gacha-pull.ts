"use client";

import { useCallback, useState, useTransition } from "react";
import { pullSingle, pull10 } from "../actions/pull";
import { getUserWalletAction } from "../actions/get-user-wallet";
import { getUserPityAction } from "../actions/get-user-pity";
import { GACHA_PULL_COST } from "../constants";
import type { PullResult, UserWallet, PityState } from "../types";

type PullPhase = "idle" | "pulling" | "revealing" | "done";

interface UseGachaPullOptions {
  bannerId: string;
  initialWallet: UserWallet;
  initialPity: PityState | null;
}

interface UseGachaPullReturn {
  phase: PullPhase;
  results: PullResult[];
  wallet: UserWallet;
  pity: PityState | null;
  isPulling: boolean;
  pull: () => void;
  pullTen: () => void;
  reset: () => void;
  completeReveal: () => void;
  canPullSingle: boolean;
  canPullTen: boolean;
}

export function useGachaPull({
  bannerId,
  initialWallet,
  initialPity,
}: UseGachaPullOptions): UseGachaPullReturn {
  const [phase, setPhase] = useState<PullPhase>("idle");
  const [results, setResults] = useState<PullResult[]>([]);
  const [wallet, setWallet] = useState<UserWallet>(initialWallet);
  const [pity, setPity] = useState<PityState | null>(initialPity);
  const [isPending, startTransition] = useTransition();

  const canPullSingle = wallet.fragments >= GACHA_PULL_COST.single;
  const canPullTen = wallet.fragments >= GACHA_PULL_COST.ten;

  const refreshState = useCallback(async () => {
    const [walletRes, pityRes] = await Promise.all([
      getUserWalletAction(),
      getUserPityAction(bannerId),
    ]);
    if (walletRes.wallet) setWallet(walletRes.wallet);
    if (pityRes.pity) setPity(pityRes.pity);
  }, [bannerId]);

  const pull = useCallback(() => {
    if (!canPullSingle || phase === "pulling") return;

    // Optimistic update
    setWallet((prev) => ({
      ...prev,
      fragments: prev.fragments - GACHA_PULL_COST.single,
    }));
    setPhase("pulling");

    startTransition(async () => {
      const res = await pullSingle(bannerId);
      if (res.error || !res.results) {
        // Revert optimistic update on failure
        await refreshState();
        setPhase("idle");
        return;
      }
      setResults(res.results);
      setPhase("revealing");
      await refreshState();
    });
  }, [bannerId, canPullSingle, phase, refreshState]);

  const pullTen = useCallback(() => {
    if (!canPullTen || phase === "pulling") return;

    setWallet((prev) => ({
      ...prev,
      fragments: prev.fragments - GACHA_PULL_COST.ten,
    }));
    setPhase("pulling");

    startTransition(async () => {
      const res = await pull10(bannerId);
      if (res.error || !res.results) {
        await refreshState();
        setPhase("idle");
        return;
      }
      setResults(res.results);
      setPhase("revealing");
      await refreshState();
    });
  }, [bannerId, canPullTen, phase, refreshState]);

  const completeReveal = useCallback(() => {
    setPhase("done");
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setResults([]);
  }, []);

  return {
    phase,
    results,
    wallet,
    pity,
    isPulling: phase === "pulling" || isPending,
    pull,
    pullTen,
    reset,
    completeReveal,
    canPullSingle,
    canPullTen,
  };
}
