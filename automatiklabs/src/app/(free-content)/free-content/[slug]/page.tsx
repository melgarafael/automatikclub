import type { Metadata } from 'next';
import { getContentBySlug } from '@/features/free-content/services/content-service';
import { ContentGate } from '@/features/free-content/components/content-gate';
import { TransmissionRenderer } from '@/features/free-content/components/transmission-renderer';
import { MarketplaceCta } from '@/features/free-content/components/marketplace-cta';
import { CoinBadge } from '@/features/free-content/components/coin-badge';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const content = await getContentBySlug(slug);

  if (!content) {
    return { title: 'Conteudo nao encontrado' };
  }

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
    },
  };
}

export default async function FreeContentPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { key } = await searchParams;

  const content = await getContentBySlug(slug);

  if (!content) {
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3">
          // CONTEUDO NAO ENCONTRADO
        </p>
        <h1 className="mt-4 font-display text-[22px] font-bold text-text-1">
          404
        </h1>
        <p className="mt-2 text-[13px] text-text-2">
          Este conteudo nao existe ou foi removido.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <CoinBadge />
      </div>

      <ContentGate slug={slug} unlockKey={key}>
        <TransmissionRenderer
          content={content}
          coinsEarned={content.coinReward}
          isStudent={false}
        />
        <div className="mt-8">
          <MarketplaceCta />
        </div>
      </ContentGate>
    </div>
  );
}
