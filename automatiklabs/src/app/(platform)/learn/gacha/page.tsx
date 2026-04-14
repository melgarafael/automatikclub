import "@/features/gacha/styles/gacha-tokens.css";

import { Topbar } from "@/shared/components/layouts/topbar";
import { Breadcrumb } from "@/shared/components/breadcrumb";
import { getBannersAction } from "@/features/gacha/actions/get-banners";
import { getUserWalletAction } from "@/features/gacha/actions/get-user-wallet";
import { getUserPityAction } from "@/features/gacha/actions/get-user-pity";
import { GachaPullScreen } from "@/features/gacha/components/gacha-pull-screen";

export const revalidate = 0; // Dynamic — wallet/pity are per-user

export default async function GachaPage() {
  const [bannersRes, walletRes] = await Promise.all([
    getBannersAction(),
    getUserWalletAction(),
  ]);

  const banners = bannersRes.banners ?? [];
  const wallet = walletRes.wallet ?? {
    userId: "",
    fragments: 0,
    credits: 0,
  };

  // Fetch pity for first banner (client will refetch on banner switch)
  const firstBannerId = banners[0]?.id;
  const pityRes = firstBannerId
    ? await getUserPityAction(firstBannerId)
    : { pity: undefined };
  const pity = pityRes.pity ?? null;

  return (
    <>
      <Topbar title="Forja do Conhecimento" />

      <div className="w-full space-y-5 py-5">
        <Breadcrumb
          items={[
            { label: "learn", href: "/learn" },
            { label: "gacha" },
          ]}
        />

        {banners.length === 0 ? (
          <div className="py-16 text-center font-mono text-[13px] text-text-3">
            Nenhum banner disponível. Volte em breve!
          </div>
        ) : (
          <GachaPullScreen
            banners={banners}
            initialWallet={wallet}
            initialPity={pity}
          />
        )}
      </div>
    </>
  );
}
