'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils';
import type { FreeContent } from '../types';
import { HtmlBlock } from './html-block';

const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const;

function formatTransmissionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${MONTHS[d.getMonth()]}.${d.getFullYear()}`;
}

function formatTransmissionNumber(id: string): string {
  const num = parseInt(id.slice(-4), 16) % 999 || 1;
  return String(num).padStart(3, '0');
}

const TYPE_LABELS: Record<string, [string, string]> = {
  'tool-showcase': ['FERRAMENTA', 'FERRAMENTAS'],
  'tutorial': ['PASSO', 'PASSOS'],
  'checklist': ['ITEM', 'ITENS'],
  'case-study': ['CASO', 'CASOS'],
  'curiosity-demo': ['SEÇÃO', 'SEÇÕES'],
  'functionality-demo': ['ETAPA', 'ETAPAS'],
};

function itemLabel(type: string, count: number): string {
  const [singular, plural] = TYPE_LABELS[type] ?? ['ITEM', 'ITENS'];
  return `${count} ${count === 1 ? singular : plural}`;
}

interface TransmissionRendererProps {
  content: FreeContent;
  coinsEarned: number;
  isStudent: boolean;
}

export function TransmissionRenderer({
  content,
  coinsEarned,
  isStudent,
}: TransmissionRendererProps) {
  const { contentData, publishedAt, id } = content;
  const { intro, items, htmlContent } = contentData;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-2 border-border bg-bg-raised rounded-[2px] px-4 py-4">
        <p className="font-mono text-[13px] font-bold text-blue">
          {'>'} TRANSMISSION #{formatTransmissionNumber(id)}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-3">
            {formatTransmissionDate(publishedAt)}
          </span>
          <span className="font-mono text-[11px] text-text-3">·</span>
          <span className="font-mono text-[11px] text-text-2">
            {itemLabel(contentData.type, items.length)}
          </span>
        </div>
      </div>

      {/* Intro */}
      {intro && (
        <p className="mt-5 font-body text-[14px] italic text-text-1">
          {intro}
        </p>
      )}

      {/* Rich HTML block (optional). Content is ADMIN-AUTHORED only —
          inserted via SUPABASE_SERVICE_ROLE_KEY, never from user input.
          Safe to render directly. */}
      {htmlContent && <HtmlBlock html={htmlContent} />}

      {/* Items */}
      <div className="mt-6 flex flex-col gap-0">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'mt-6 border-l-[3px] border-blue pl-4',
              'animate-[fadeSlideIn_150ms_ease_both]',
            )}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <p className="font-display text-[18px] font-bold text-text-1">
              {item.emoji} {item.title}
            </p>
            <p className="mt-2 font-body text-[14px] text-text-1">
              {item.description}
            </p>

            {item.tip && (
              <div className="mt-3 rounded-[2px] bg-bg-inset px-3 py-2">
                <p className="font-mono text-[11px] text-text-3">
                  <span className="font-bold">Dica:</span> {item.tip}
                </p>
              </div>
            )}

            {item.link && (
              <a
                href={item.link}
                {...(item.link.startsWith('/') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                className="mt-3 block w-full sm:w-auto"
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)] sm:w-auto"
                >
                  <ExternalLink className="size-3.5" />
                  {item.linkLabel || 'Acessar'}
                </Button>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Coins earned */}
      {coinsEarned > 0 && (
        <div className="mt-8 border-t-2 border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue">
            // RECOMPENSA
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[16px]">🪙</span>
            <p className="font-mono text-[13px] text-cyan">
              +{coinsEarned} moedas adicionadas ao seu saldo
            </p>
          </div>
          {isStudent && (
            <p className="mt-1 font-mono text-[11px] text-text-3">
              (🪙 bônus 2x por ser aluno)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
