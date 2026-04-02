'use client';

import { useEffect, useState } from 'react';

export function CoinBadge() {
  const [coins, setCoins] = useState<number | null>(null);

  useEffect(() => {
    // Only fetch if session cookie exists
    if (!document.cookie.split(';').some(c => c.trim().startsWith('fc_active='))) return;

    fetch('/api/free-content/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.coins != null) setCoins(data.coins);
      })
      .catch(() => {});
  }, []);

  if (coins === null) return null;

  return (
    <span className="inline-flex items-center gap-1 font-mono text-[13px] text-cyan">
      🪙 {coins}
    </span>
  );
}
