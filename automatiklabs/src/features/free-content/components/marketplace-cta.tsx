'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

export function MarketplaceCta() {
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    if (!document.cookie.split(';').some(c => c.trim().startsWith('fc_active='))) return;

    fetch('/api/free-content/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.coins != null) setCoins(data.coins);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mt-8 border-t-2 border-border pt-6">
      <p className="font-display text-[15px] font-semibold text-text-1">
        Gostou? Tem mais de onde veio!
      </p>
      <p className="mt-1 font-body text-[13px] text-text-2">
        Use suas moedas para desbloquear mais conteúdos
      </p>
      {coins !== null && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[16px]">🪙</span>
          <p className="font-mono text-[13px] text-cyan">
            {coins} moedas disponíveis
          </p>
        </div>
      )}
      <Link href="/free-content/marketplace" className="mt-4 block">
        <Button variant="default" className="gap-2">
          Ver Marketplace
          <ArrowRight className="size-3.5" />
        </Button>
      </Link>
    </div>
  );
}
