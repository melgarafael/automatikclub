import "@/features/gacha/styles/gacha-tokens.css";

import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getUserWalletAction } from "@/features/gacha/actions/get-user-wallet";
import { getInventoryAction } from "@/features/gacha/actions/get-inventory";
import { getCollectionProgressAction } from "@/features/gacha/actions/get-inventory";
import { InventoryPageClient } from "@/features/gacha/components/inventory-page-client";

export const revalidate = 0;

export default async function InventoryPage() {
  const [inventoryRes, walletRes, collection] = await Promise.all([
    getInventoryAction(),
    getUserWalletAction(),
    getCollectionProgressAction(),
  ]);

  const items = inventoryRes.items ?? [];
  const wallet = walletRes.wallet ?? { userId: "", fragments: 0, credits: 0 };

  return (
    <>
      <Topbar title="Inventário" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "gacha", href: "/learn/gacha" },
            { label: "inventário" },
          ]}
        />

        <InventoryPageClient
          initialItems={items}
          wallet={wallet}
          collection={collection}
        />
      </div>
    </>
  );
}
