import Link from 'next/link';
import { getAllPublishedContent } from '@/features/free-content/services/content-service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Conteudos Gratuitos',
  description:
    'Ferramentas, dicas e recursos gratuitos para dominar IA. Pelo AutomatikClub.',
};

const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${MONTHS[d.getMonth()]}.${d.getFullYear()}`;
}

export default async function FreeContentHub() {
  const contents = await getAllPublishedContent();

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue">
          // FREE CONTENT HUB
        </p>
        <h1 className="mt-2 font-display text-[22px] font-bold text-text-1">
          Conteudos Gratuitos
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-text-2">
          Ferramentas, dicas e recursos para voce dominar IA. Cada conteudo te
          da moedas para desbloquear mais.
        </p>
      </div>

      {/* Content list */}
      <div className="space-y-4">
        {contents.map((content) => (
          <Link
            key={content.id}
            href={`/free-content/${content.slug}`}
            className="block rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] hover:-translate-y-px hover:border-blue hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-start justify-between">
              <h2 className="font-display text-[15px] font-semibold text-text-1">
                {content.title}
              </h2>
              <span className="ml-2 shrink-0 font-mono text-[11px] text-cyan">
                +{content.coinReward} 🪙
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] text-text-2">
              {content.description}
            </p>
            <p className="mt-3 font-mono text-[11px] text-text-3">
              → {formatDate(content.publishedAt)}
            </p>
          </Link>
        ))}
      </div>

      {contents.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-[13px] text-text-3">
            Nenhum conteudo disponivel ainda.
          </p>
        </div>
      )}
    </div>
  );
}
