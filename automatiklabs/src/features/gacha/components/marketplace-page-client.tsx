"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { MarketplaceListing } from "../types";
import { MarketplaceGrid } from "./marketplace-grid";

interface MarketplacePageClientProps {
  initialListings: MarketplaceListing[];
  initialMyListings: MarketplaceListing[];
  userCredits: number;
}

export function MarketplacePageClient({
  initialListings,
  initialMyListings,
  userCredits,
}: MarketplacePageClientProps) {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <MarketplaceGrid
      listings={initialListings}
      myListings={initialMyListings}
      userCredits={userCredits}
      onPurchased={refresh}
      onCancelled={refresh}
    />
  );
}
