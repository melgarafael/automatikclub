'use client';

import { Check, Lock } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils';
import type { MarketplaceContent } from '../types';

const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const;

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
}

interface MarketplaceCardProps {
  content: MarketplaceContent;
  onClick: () => void;
}

export function MarketplaceCard({ content, onClick }: MarketplaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'rounded-[2px] border-2 border-border bg-bg-raised px-4 py-4',
        'transition-all duration-[80ms] ease-linear',
        'hover:-translate-y-px hover:border-blue hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-[15px] font-semibold text-text-1 leading-snug">
          {content.title}
        </p>
        <span className="shrink-0 font-mono text-[11px] text-text-3">
          {formatShortDate(content.publishedAt)}
        </span>
      </div>

      <p className="mt-2 font-body text-[13px] text-text-2 line-clamp-2">
        {content.description}
      </p>

      <div className="mt-3">
        {content.isUnlocked ? (
          <Badge variant="mod">
            <Check className="size-3" />
            DESBLOQUEADO
          </Badge>
        ) : (
          <Badge variant="admin">
            <Lock className="size-3" />
            {content.coinCost} moedas
          </Badge>
        )}
      </div>
    </button>
  );
}
