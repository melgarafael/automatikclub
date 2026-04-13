import "@/features/gacha/styles/gacha-tokens.css";

import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getUserWalletAction } from "@/features/gacha/actions/get-user-wallet";
import { getMarketplaceAction, getMyListingsAction } from "@/features/gacha/actions/get-marketplace";
import { CurrencyDisplay } from "@/features/gacha/components/currency-display";
import { MarketplacePageClient } from "@/features/gacha/components/marketplace-page-client";

export const revalidate = 0;

export default async function MarketplacePage() {
  const [listingsRes, myListingsRes, walletRes] = await Promise.all([
    getMarketplaceAction(),
    getMyListingsAction(),
    getUserWalletAction(),
  ]);

  const listings = listingsRes.listings ?? [];
  const myListings = myListingsRes.listings ?? [];
  const wallet = walletRes.wallet ?? { userId: "", fragments: 0, credits: 0 };

  return (
    <>
      <Topbar title="Marketplace" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "gacha", href: "/learn/gacha" },
            { label: "marketplace" },
          ]}
        />

        <CurrencyDisplay
          fragments={wallet.fragments}
          credits={wallet.credits}
        />

        <MarketplacePageClient
          initialListings={listings}
          initialMyListings={myListings}
          userCredits={wallet.credits}
        />
      </div>
    </>
  );
}
