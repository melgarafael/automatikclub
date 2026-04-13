"use client";

import { useState } from "react";
import { BannerCarousel } from "./banner-carousel";
import { BannerDetail } from "./banner-detail";
import { PullButtons } from "./pull-buttons";
import { PityCounter } from "./pity-counter";
import { CurrencyDisplay } from "./currency-display";
import { PullResultDisplay } from "./pull-result-display";
import { PullSequence } from "./pull-animation/pull-sequence";
import { useGachaPull } from "../hooks/use-gacha-pull";
import type { GachaBanner, UserWallet, PityState } from "../types";

interface GachaPullScreenProps {
  banners: GachaBanner[];
  initialWallet: UserWallet;
  initialPity: PityState | null;
}

export function GachaPullScreen({
  banners,
  initialWallet,
  initialPity,
}: GachaPullScreenProps) {
  const [selectedBannerId, setSelectedBannerId] = useState<string>(
    banners[0]?.id ?? ""
  );

  const selectedBanner = banners.find((b) => b.id === selectedBannerId);

  const {
    phase,
    results,
    wallet,
    pity,
    isPulling,
    pull,
    pullTen,
    reset,
    completeReveal,
    canPullSingle,
    canPullTen,
  } = useGachaPull({
    bannerId: selectedBannerId,
    initialWallet,
    initialPity,
  });

  // --- ANIMATION PHASE ---
  if (phase === "revealing" && results.length > 0) {
    return (
      <PullSequence
        results={results}
        mode={results.length > 1 ? "multi" : "single"}
        onComplete={completeReveal}
      />
    );
  }

  // --- RESULT PHASE ---
  if (phase === "done" && results.length > 0) {
    return <PullResultDisplay results={results} onBack={reset} />;
  }

  // --- IDLE / PULLING PHASE ---
  return (
    <div className="space-y-5">
      {/* Currency bar */}
      <div className="flex items-center justify-between">
        <CurrencyDisplay
          fragments={wallet.fragments}
          credits={wallet.credits}
        />
      </div>

      {/* Banner selection */}
      <BannerCarousel
        banners={banners}
        selectedId={selectedBannerId}
        onSelect={setSelectedBannerId}
      />

      {/* Banner detail + pity + pull buttons */}
      {selectedBanner && (
        <div className="space-y-4">
          <BannerDetail banner={selectedBanner} />

          <PityCounter pity={pity} />

          <PullButtons
            onPullSingle={pull}
            onPullTen={pullTen}
            canPullSingle={canPullSingle}
            canPullTen={canPullTen}
            isPulling={isPulling}
            className="w-full md:w-auto"
          />
        </div>
      )}
    </div>
  );
}
