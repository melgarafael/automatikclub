'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { MarketplaceCard } from './marketplace-card';
import type { MarketplaceContent } from '../types';

interface MarketplaceGridProps {
  contents: MarketplaceContent[];
  coins: number;
  onContentClick?: (content: MarketplaceContent) => void;
}

function ContentList({
  items,
  emptyMessage,
  onContentClick,
}: {
  items: MarketplaceContent[];
  emptyMessage: string;
  onContentClick?: (content: MarketplaceContent) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-[11px] text-text-3">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((content) => (
        <MarketplaceCard
          key={content.id}
          content={content}
          onClick={() => onContentClick?.(content)}
        />
      ))}
    </div>
  );
}

export function MarketplaceGrid({ contents, coins, onContentClick }: MarketplaceGridProps) {
  const unlocked = contents.filter((c) => c.isUnlocked);
  const locked = contents.filter((c) => !c.isUnlocked);

  return (
    <div className="w-full">
      {/* Balance */}
      <div className="flex items-center gap-2">
        <span className="text-[16px]">🪙</span>
        <p className="font-mono text-[13px] text-cyan">
          Saldo: {coins} moedas
        </p>
      </div>

      {/* Section header */}
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.1em] text-blue">
        // CONTEUDOS DISPONIVEIS
      </p>

      {/* Filter tabs */}
      <Tabs defaultValue="all" className="mt-3">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="unlocked">Desbloqueados</TabsTrigger>
          <TabsTrigger value="locked">Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <ContentList
            items={contents}
            emptyMessage="Nenhum conteúdo disponível no momento."
            onContentClick={onContentClick}
          />
        </TabsContent>

        <TabsContent value="unlocked" className="mt-4">
          <ContentList
            items={unlocked}
            emptyMessage="Nenhum conteúdo desbloqueado ainda."
            onContentClick={onContentClick}
          />
        </TabsContent>

        <TabsContent value="locked" className="mt-4">
          <ContentList
            items={locked}
            emptyMessage="Todos os conteúdos já foram desbloqueados!"
            onContentClick={onContentClick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
