import { getFCSession } from '@/features/free-content/services/cookie-service';
import {
  getAllPublishedContent,
  getBalance,
} from '@/features/free-content/services/content-service';
import { MarketplaceGrid } from '@/features/free-content/components/marketplace-grid';
import { CoinBadge } from '@/features/free-content/components/coin-badge';

export const metadata = {
  title: 'Marketplace — Conteudos Gratuitos',
  description:
    'Use suas moedas para desbloquear conteudos exclusivos do AutomatikClub.',
};

export default async function MarketplacePage() {
  const session = await getFCSession();

  if (!session) {
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue">
          // MARKETPLACE
        </p>
        <h1 className="mt-4 font-display text-[22px] font-bold text-text-1">
          Acesse um conteudo primeiro
        </h1>
        <p className="mt-2 text-[13px] text-text-2">
          Pegue seu primeiro conteudo gratuito para ganhar moedas e acessar o
          marketplace.
        </p>
      </div>
    );
  }

  const [contents, balance] = await Promise.all([
    getAllPublishedContent(session.email),
    getBalance(session.email),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue">
            // MARKETPLACE
          </p>
          <h1 className="mt-1 font-display text-[22px] font-bold text-text-1">
            Conteudos
          </h1>
        </div>
        <CoinBadge />
      </div>
      <MarketplaceGrid contents={contents} coins={balance.coins} />
    </div>
  );
}
